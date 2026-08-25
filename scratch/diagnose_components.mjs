import React from 'react';
import { renderToString } from 'react-dom/server';

// Mock browser globals for SSR test
globalThis.window = {
  location: { href: 'http://localhost:3000' },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  scrollTo: () => {},
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
};
globalThis.document = {
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, remove: () => {} }),
  body: { appendChild: () => {} },
  getElementById: () => null,
};
globalThis.localStorage = globalThis.window.localStorage;

console.log('--- STARTING COMPREHENSIVE COMPONENT DIAGNOSTIC ---');

const testModule = async (name, importFn) => {
  try {
    const mod = await importFn();
    console.log(`✅ [IMPORT SUCCESS] ${name}`);
    return mod;
  } catch (err) {
    console.error(`❌ [IMPORT FAILED] ${name}:`, err);
    return null;
  }
};

async function run() {
  await testModule('localDatabaseService', () => import('../src/services/localDatabaseService.js'));
  await testModule('achievementService', () => import('../src/services/achievementService.js'));
  await testModule('adaptiveLearningService', () => import('../src/services/adaptiveLearningService.js'));
  await testModule('flashcardService', () => import('../src/services/flashcardService.js'));
  await testModule('analyticsHelpers', () => import('../src/utils/analyticsHelpers.js'));
  await testModule('questionsLoader', () => import('../src/data/questionsLoader.js'));

  const AppMod = await testModule('App.jsx', () => import('../src/App.jsx'));
  if (AppMod) {
    try {
      const App = AppMod.default;
      console.log('Testing App renderToString...');
      const html = renderToString(React.createElement(App));
      console.log('✅ App rendered successfully! HTML length:', html.length);
    } catch (renderErr) {
      console.error('❌ [RENDER ERROR in App]:', renderErr);
    }
  }

  console.log('--- COMPREHENSIVE COMPONENT DIAGNOSTIC COMPLETED ---');
}

run();
