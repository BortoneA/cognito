import { JSDOM, VirtualConsole } from 'jsdom';

async function testUrl(url) {
  console.log(`\n========================================`);
  console.log(`TESTING URL: ${url}`);
  console.log(`========================================`);

  const virtualConsole = new VirtualConsole();
  virtualConsole.on('log', (...args) => console.log(`[BROWSER LOG]:`, ...args));
  virtualConsole.on('warn', (...args) => console.warn(`[BROWSER WARN]:`, ...args));
  virtualConsole.on('error', (...args) => console.error(`[BROWSER ERROR]:`, ...args));
  virtualConsole.on('jsdomError', (err) => console.error(`[JSDOM ERROR]:`, err.message));

  try {
    const dom = await JSDOM.fromURL(url, {
      resources: 'usable',
      runScripts: 'dangerously',
      virtualConsole,
      beforeParse(window) {
        window.fetch = async (fetchUrl) => {
          console.log(`[BROWSER FETCH]:`, fetchUrl);
          const fullUrl = fetchUrl.startsWith('http') ? fetchUrl : `${url}${fetchUrl}`;
          try {
            const res = await fetch(fullUrl);
            const text = await res.text();
            return {
              ok: res.ok,
              status: res.status,
              json: async () => JSON.parse(text),
              text: async () => text,
            };
          } catch (e) {
            console.error(`[FETCH FAILED]:`, e);
            throw e;
          }
        };
        window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
        window.scrollTo = () => {};
      }
    });

    console.log('Waiting 4 seconds for scripts & React to mount...');
    await new Promise(r => setTimeout(r, 4000));

    const root = dom.window.document.getElementById('root');
    console.log(`\nRoot element innerHTML length: ${root ? root.innerHTML.length : 'NULL'}`);
    if (root && root.innerHTML.length > 0) {
      console.log(`Root HTML snippet: ${root.innerHTML.substring(0, 300)}...`);
      console.log(`✅ SUCCESS: React mounted properly on ${url}!`);
    } else {
      console.log(`❌ FAILURE: Root element is empty on ${url}`);
    }
  } catch (err) {
    console.error(`Failed to load ${url}:`, err);
  }
}

async function run() {
  await testUrl('http://localhost:4000');
  await testUrl('http://localhost:3002');
}

run();
