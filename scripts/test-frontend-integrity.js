const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith('.html'));
const failures = [];

function fail(message) {
  failures.push(message);
}

function cleanReference(value) {
  return value.split('#')[0].split('?')[0].trim();
}

for (const filename of htmlFiles) {
  const fullPath = path.join(root, filename);
  const source = fs.readFileSync(fullPath, 'utf8');

  if (!/<meta\s+name=["']viewport["']/i.test(source)) {
    fail(`${filename}: missing viewport meta tag`);
  }

  const ids = [...source.matchAll(/\sid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  for (const id of [...new Set(duplicates)]) {
    fail(`${filename}: duplicate id "${id}"`);
  }

  const references = [...source.matchAll(/\s(?:href|src)=["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter((value) => value && !value.startsWith('#'))
    .filter((value) => !/^(?:https?:|mailto:|tel:|javascript:|data:)/i.test(value));

  for (const rawReference of references) {
    const reference = cleanReference(rawReference);
    if (!reference || reference.includes('${')) continue;
    const target = path.resolve(path.dirname(fullPath), reference);
    if (!fs.existsSync(target)) {
      fail(`${filename}: missing local reference "${rawReference}"`);
    }
  }
}

const menuSource = fs.readFileSync(path.join(root, 'menu-data.js'), 'utf8');
const sandbox = {
  window: {},
  console,
  localStorage: {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
  }
};
vm.createContext(sandbox);
vm.runInContext(menuSource, sandbox, { filename: 'menu-data.js' });

const catalog = sandbox.window.CornerCravingsMenu;
if (!Array.isArray(catalog)) {
  fail('menu-data.js: shared catalog did not initialize');
} else {
  const productIds = new Set();
  for (const product of catalog) {
    if (!product.id) {
      fail(`menu-data.js: product without an id (${product.name || 'unnamed'})`);
      continue;
    }
    if (productIds.has(product.id)) fail(`menu-data.js: duplicate product id "${product.id}"`);
    productIds.add(product.id);

    const productImage = product.imageWebp || product.imageJpg;
    if (productImage) {
      const imagePath = path.resolve(root, cleanReference(productImage));
      if (!fs.existsSync(imagePath)) {
        fail(`menu-data.js: ${product.id} points to missing image "${productImage}"`);
      }
    }
  }
}

if (failures.length) {
  console.error(`Frontend integrity audit failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Frontend integrity audit passed: ${htmlFiles.length} pages and all shared catalog images verified.`);
