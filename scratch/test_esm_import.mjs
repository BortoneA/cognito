import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

console.log('Testing ES module import of dist bundle...');

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="root"></div></body></html>`, {
  runScripts: 'dangerously',
  url: 'http://localhost:3000',
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.location = dom.window.location;
globalThis.localStorage = dom.window.localStorage;
globalThis.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
globalThis.scrollTo = () => {};
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLCanvasElement = dom.window.HTMLCanvasElement;
globalThis.customElements = dom.window.customElements;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

const distAssets = fs.readdirSync('dist/assets');
const mainBundle = distAssets.find(f => f.startsWith('index-') && f.endsWith('.js'));

async function run() {
  try {
    const bundlePath = path.resolve('dist/assets', mainBundle);
    console.log('Importing bundle from:', bundlePath);
    await import('file://' + bundlePath.replace(/\\/g, '/'));
    console.log('✅ Bundle imported successfully without crash!');
    
    // Wait for React to mount in root
    await new Promise(r => setTimeout(r, 1000));
    const root = dom.window.document.getElementById('root');
    console.log('Root innerHTML length:', root ? root.innerHTML.length : 0);
    if (root && root.innerHTML.length > 0) {
      console.log('Root HTML snippet:\n', root.innerHTML.substring(0, 500));
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ CRASH IN BUNDLE IMPORT:', err);
    process.exit(1);
  }
}

run();
