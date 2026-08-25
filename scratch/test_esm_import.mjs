import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distAssets = path.join(__dirname, '..', 'dist', 'assets');

const files = fs.readdirSync(distAssets);
const mainBundle = files.find(f => f.startsWith('index-') && f.endsWith('.js'));

if (!mainBundle) {
  console.error('No main bundle found in dist/assets');
  process.exit(1);
}

const bundlePath = path.join(distAssets, mainBundle);
console.log('Testing ES module import of dist bundle:', bundlePath);

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:4000/',
  runScripts: 'outside-only'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

try {
  await import(`file:///${bundlePath.replace(/\\/g, '/')}`);
  console.log('✅ Bundle imported successfully without crash!');
  console.log('Root innerHTML length:', dom.window.document.getElementById('root')?.innerHTML?.length || 0);
  console.log('Root HTML snippet:\n', dom.window.document.getElementById('root')?.innerHTML?.slice(0, 300));
} catch (e) {
  console.error('❌ Bundle crashed:', e);
  process.exit(1);
}
