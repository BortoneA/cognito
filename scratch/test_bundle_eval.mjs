import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

console.log('Testing bundle evaluation in JSDOM...');

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="root"></div></body></html>`, {
  runScripts: 'dangerously',
  url: 'http://localhost:3000',
});

// Setup globals on window
dom.window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
dom.window.scrollTo = () => {};

// Read the js files from dist/assets
const distAssets = fs.readdirSync('dist/assets');
console.log('Dist assets:', distAssets);

const mainBundle = distAssets.find(f => f.startsWith('index-') && f.endsWith('.js'));
console.log('Main bundle file:', mainBundle);

if (mainBundle) {
  const code = fs.readFileSync(path.join('dist/assets', mainBundle), 'utf8');
  console.log('Main bundle code length:', code.length);
  
  // Intercept errors in DOM window
  dom.window.addEventListener('error', (e) => {
    console.error('💥 DOM WINDOW ERROR EVENT:', e.message, e.error);
  });

  // Evaluate script in the window context
  try {
    const script = dom.window.document.createElement('script');
    script.textContent = code;
    dom.window.document.body.appendChild(script);

    console.log('Script executed. Checking root element...');
    const root = dom.window.document.getElementById('root');
    console.log('Root innerHTML length:', root ? root.innerHTML.length : 0);
    if (root && root.innerHTML.length > 0) {
      console.log('Root HTML:', root.innerHTML.substring(0, 300));
    }
  } catch (err) {
    console.error('❌ EXCEPTION DURING BUNDLE EXECUTION:', err);
  }
}
