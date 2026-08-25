import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4000;
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_DIR = path.join(__dirname, 'src', 'data');
const PUBLIC_DATA_DIR = path.join(__dirname, 'public', 'data');

const PROGRESS_FILE = path.join(DATA_DIR, 'user_progress_pna.json');
const PUBLIC_PROGRESS_FILE = path.join(PUBLIC_DATA_DIR, 'user_progress_pna.json');
const QUESTIONS_FILE = path.join(DATA_DIR, 'banco_questoes_pna.json');
const PUBLIC_QUESTIONS_FILE = path.join(PUBLIC_DATA_DIR, 'banco_questoes_pna.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DATA_DIR)) fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp'
};

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');
};

const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
};

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. API: Save User Progress to Disk File
  if (pathname === '/api/save-progress' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const payload = {
        updatedAt: new Date().toISOString(),
        ...data
      };
      const jsonStr = JSON.stringify(payload, null, 2);

      fs.writeFileSync(PROGRESS_FILE, jsonStr, 'utf-8');
      fs.writeFileSync(PUBLIC_PROGRESS_FILE, jsonStr, 'utf-8');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, savedAt: payload.updatedAt, answersCount: Object.keys(data.answers || {}).length }));
      return;
    } catch (err) {
      console.error('Error saving progress to disk:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
      return;
    }
  }

  // 2. API: Load User Progress from Disk File
  if (pathname === '/api/load-progress' && req.method === 'GET') {
    try {
      if (fs.existsSync(PROGRESS_FILE)) {
        const content = fs.readFileSync(PROGRESS_FILE, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(content);
        return;
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ empty: true }));
        return;
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // 3. API: Save / Edit Question to Disk File
  if (pathname === '/api/save-question' && req.method === 'POST') {
    try {
      const updatedQ = await parseBody(req);
      if (!updatedQ || !updatedQ.id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Question ID is required' }));
        return;
      }

      let dbData = { dataset: 'PNA_MED_PORTUGAL_MASTER', questoes: [] };
      if (fs.existsSync(QUESTIONS_FILE)) {
        dbData = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf-8'));
      }

      let questoes = dbData.questoes || [];
      const idx = questoes.findIndex(q => q.id === updatedQ.id);

      if (idx >= 0) {
        questoes[idx] = { ...questoes[idx], ...updatedQ, updatedAt: Date.now() };
      } else {
        questoes.unshift({ ...updatedQ, createdAt: Date.now() });
      }

      dbData.questoes = questoes;
      dbData.totalQuestoes = questoes.length;
      dbData.lastModified = new Date().toISOString();

      const jsonStr = JSON.stringify(dbData, null, 2);
      fs.writeFileSync(QUESTIONS_FILE, jsonStr, 'utf-8');
      fs.writeFileSync(PUBLIC_QUESTIONS_FILE, jsonStr, 'utf-8');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, id: updatedQ.id, totalQuestoes: questoes.length }));
      return;
    } catch (err) {
      console.error('Error saving question to disk:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
      return;
    }
  }

  // 4. API: Save Full Database to Disk File
  if (pathname === '/api/save-database' && req.method === 'POST') {
    try {
      const fullDb = await parseBody(req);
      const jsonStr = JSON.stringify(fullDb, null, 2);
      fs.writeFileSync(QUESTIONS_FILE, jsonStr, 'utf-8');
      fs.writeFileSync(PUBLIC_QUESTIONS_FILE, jsonStr, 'utf-8');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: (fullDb.questoes || []).length }));
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // 5. Static File Serving (Vite dist folder)
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const fileStream = fs.createReadStream(filePath);
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    });
    fileStream.pipe(res);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[PNA Local Server] Live at http://0.0.0.0:${PORT}`);
  console.log(`[PNA Local Server] Direct Disk Sync enabled in: ${DATA_DIR}`);
});
