const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const pages = fs.readdirSync(root).filter((name) => name.endsWith('.html')).sort();
const viewports = [360, 768, 1440];
const port = 9333 + Math.floor(Math.random() * 500);
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'corner-cravings-responsive-'));
const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const chromePath = chromeCandidates.find(fs.existsSync);

if (!chromePath) {
  console.error('Responsive audit skipped: Chrome or Edge was not found.');
  process.exit(1);
}

const browser = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  'http://localhost/Corner-Cravings/index.html'
], { stdio: 'ignore', windowsHide: true });

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function devtoolsTarget() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const page = targets.find((target) => target.type === 'page');
      if (page) return page;
    } catch (error) {
      // Chrome may still be starting.
    }
    await delay(250);
  }
  throw new Error('Could not connect to the headless browser.');
}

function connect(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let nextId = 0;
  const pending = new Map();

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const request = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result || {});
  };

  socket.onclose = () => {
    for (const request of pending.values()) {
      request.reject(new Error('DevTools WebSocket closed unexpectedly.'));
    }
    pending.clear();
  };

  const ready = new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = () => reject(new Error('DevTools WebSocket connection failed.'));
  });

  return {
    ready,
    close() { socket.close(); },
    async send(method, params = {}) {
      await ready;
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    }
  };
}

async function run() {
  const target = await devtoolsTarget();
  const client = connect(target.webSocketDebuggerUrl);
  await client.ready;
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  const failures = [];
  for (const width of viewports) {
    await client.send('Emulation.setDeviceMetricsOverride', {
      width,
      height: width <= 480 ? 800 : 1000,
      deviceScaleFactor: 1,
      mobile: width <= 480
    });

    for (const page of pages) {
      const url = `http://localhost/Corner-Cravings/${encodeURIComponent(page)}`;
      const navigation = await client.send('Page.navigate', { url });
      if (navigation.errorText) {
        failures.push(`${page} at ${width}px: navigation failed (${navigation.errorText})`);
        continue;
      }
      await delay(350);

      const response = await client.send('Runtime.evaluate', {
        expression: `(() => {
          const root = document.documentElement;
          const body = document.body;
          return {
            viewport: root.clientWidth,
            rootWidth: root.scrollWidth,
            bodyWidth: body ? body.scrollWidth : 0,
            path: location.pathname,
            offenders: Array.from(document.querySelectorAll('body *')).map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                tag: element.tagName.toLowerCase(),
                id: element.id || '',
                className: typeof element.className === 'string' ? element.className : '',
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                width: Math.round(rect.width)
              };
            }).filter((item) => item.right > root.clientWidth + 2 || item.left < -2)
              .sort((a, b) => (b.right - root.clientWidth) - (a.right - root.clientWidth))
              .slice(0, 4)
          };
        })()`,
        returnByValue: true
      });
      const metrics = response.result && response.result.value;
      if (!metrics) {
        failures.push(`${page} at ${width}px: no layout metrics returned`);
        continue;
      }
      const overflow = Math.max(metrics.rootWidth, metrics.bodyWidth) - metrics.viewport;
      if (overflow > 2) {
        const details = metrics.offenders.map((item) => {
          const name = `${item.tag}${item.id ? `#${item.id}` : ''}${item.className ? `.${item.className.trim().replace(/\s+/g, '.')}` : ''}`;
          return `${name} [${item.left}, ${item.right}]`;
        }).join(', ');
        failures.push(`${page} at ${width}px: horizontal overflow of ${overflow}px${details ? `; ${details}` : ''}`);
      }
    }
  }

  client.close();
  if (failures.length) {
    console.error(`Responsive layout audit failed with ${failures.length} issue(s):`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log(`Responsive layout audit passed: ${pages.length} pages at ${viewports.join(', ')}px.`);
  }
}

run()
  .catch((error) => {
    console.error(`Responsive layout audit failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (process.platform === 'win32' && browser.pid) {
      spawnSync('taskkill', ['/pid', String(browser.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true });
    } else {
      browser.kill();
    }
    await delay(500);
    try {
      fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch (error) {
      console.warn(`Responsive audit warning: could not remove temporary browser profile (${error.code}).`);
    }
  });
