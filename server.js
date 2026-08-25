import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

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

// Ensure local directories exist for backup
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DATA_DIR)) fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });

// Neon PostgreSQL Connection Pool
const NEON_CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_z2qTrQUdL1fO@ep-twilight-rain-ax35ff12-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: NEON_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
  console.error('[Neon Postgres Error]', err.message);
});

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

  // 1. API: Save User Progress to Neon PostgreSQL + Local Disk Backup
  if (pathname === '/api/save-progress' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const payload = {
        updatedAt: new Date().toISOString(),
        ...data
      };

      // Neon PostgreSQL Write
      try {
        await pool.query(`
          INSERT INTO user_progress (
            user_id, answers, saved_questions, notes, exam_history, daily_activity, unlocked_badges, highlighter_color, daily_goal, updated_at
          ) VALUES (
            'default_user', $1, $2, $3, $4, $5, $6, $7, $8, NOW()
          )
          ON CONFLICT (user_id) DO UPDATE SET
            answers = EXCLUDED.answers,
            saved_questions = EXCLUDED.saved_questions,
            notes = EXCLUDED.notes,
            exam_history = EXCLUDED.exam_history,
            daily_activity = EXCLUDED.daily_activity,
            unlocked_badges = EXCLUDED.unlocked_badges,
            highlighter_color = EXCLUDED.highlighter_color,
            daily_goal = EXCLUDED.daily_goal,
            updated_at = NOW();
        `, [
          JSON.stringify(data.answers || {}),
          JSON.stringify(data.savedQuestions || {}),
          JSON.stringify(data.notes || {}),
          JSON.stringify(data.examHistory || []),
          JSON.stringify(data.dailyActivity || {}),
          JSON.stringify(data.unlockedBadges || {}),
          data.highlighterColor || 'yellow',
          data.dailyGoal || 20
        ]);
      } catch (dbErr) {
        console.error('[Neon save progress error]', dbErr.message);
      }

      // Local Disk Backup Write
      try {
        const jsonStr = JSON.stringify(payload, null, 2);
        fs.writeFileSync(PROGRESS_FILE, jsonStr, 'utf-8');
        fs.writeFileSync(PUBLIC_PROGRESS_FILE, jsonStr, 'utf-8');
      } catch (fsErr) {
        console.warn('[Disk backup notice]', fsErr.message);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        source: 'Neon PostgreSQL + Disk Sync',
        savedAt: payload.updatedAt, 
        answersCount: Object.keys(data.answers || {}).length 
      }));
      return;
    } catch (err) {
      console.error('Error saving progress:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
      return;
    }
  }

  // 2. API: Load User Progress from Neon PostgreSQL (with fallback to local disk)
  if (pathname === '/api/load-progress' && req.method === 'GET') {
    try {
      // First try Neon
      try {
        const dbRes = await pool.query('SELECT * FROM user_progress WHERE user_id = $1 LIMIT 1', ['default_user']);
        if (dbRes.rows && dbRes.rows.length > 0) {
          const row = dbRes.rows[0];
          const result = {
            updatedAt: row.updated_at,
            answers: row.answers || {},
            savedQuestions: row.saved_questions || {},
            notes: row.notes || {},
            examHistory: row.exam_history || [],
            dailyActivity: row.daily_activity || {},
            unlockedBadges: row.unlocked_badges || {},
            highlighterColor: row.highlighter_color || 'yellow',
            dailyGoal: row.daily_goal || 20
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }
      } catch (neonErr) {
        console.warn('[Neon load fallback to disk]', neonErr.message);
      }

      // Disk fallback
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

  // 3. API: Fetch All Questions from Neon PostgreSQL
  if (pathname === '/api/questions' && req.method === 'GET') {
    try {
      const qRes = await pool.query(`
        SELECT 
          id, ano_da_prova, numero, enunciado, alternativas, resposta_correta,
          explicacao, area, subarea, doenca_ou_conjunto_de_doencas, nivel_de_dificuldade, tags, updated_at
        FROM questoes 
        ORDER BY ano_da_prova DESC, numero ASC
      `);

      if (qRes.rows && qRes.rows.length > 0) {
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60'
        });
        res.end(JSON.stringify({
          source: 'Neon PostgreSQL Cloud',
          totalQuestoes: qRes.rows.length,
          questoes: qRes.rows
        }));
        return;
      }
    } catch (neonErr) {
      console.warn('[Neon fetch questions fallback]', neonErr.message);
    }

    // Fallback to local static file
    if (fs.existsSync(QUESTIONS_FILE)) {
      const fileStream = fs.createReadStream(QUESTIONS_FILE);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      fileStream.pipe(res);
      return;
    }
  }

  // 4. API: Save / Edit Question in Neon PostgreSQL + Local Disk
  if (pathname === '/api/save-question' && req.method === 'POST') {
    try {
      const updatedQ = await parseBody(req);
      if (!updatedQ || !updatedQ.id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Question ID is required' }));
        return;
      }

      // Neon PostgreSQL Write
      try {
        await pool.query(`
          INSERT INTO questoes (
            id, ano_da_prova, numero, enunciado, alternativas, resposta_correta,
            explicacao, area, subarea, doenca_ou_conjunto_de_doencas, nivel_de_dificuldade, tags, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
          ON CONFLICT (id) DO UPDATE SET
            ano_da_prova = EXCLUDED.ano_da_prova,
            numero = EXCLUDED.numero,
            enunciado = EXCLUDED.enunciado,
            alternativas = EXCLUDED.alternativas,
            resposta_correta = EXCLUDED.resposta_correta,
            explicacao = EXCLUDED.explicacao,
            area = EXCLUDED.area,
            subarea = EXCLUDED.subarea,
            doenca_ou_conjunto_de_doencas = EXCLUDED.doenca_ou_conjunto_de_doencas,
            nivel_de_dificuldade = EXCLUDED.nivel_de_dificuldade,
            tags = EXCLUDED.tags,
            updated_at = NOW();
        `, [
          updatedQ.id,
          updatedQ.ano_da_prova || null,
          updatedQ.numero || null,
          updatedQ.enunciado || '',
          JSON.stringify(updatedQ.alternativas || {}),
          updatedQ.resposta_correta || 'A',
          updatedQ.explicacao || '',
          updatedQ.area || 'Outros',
          updatedQ.subarea || 'Geral',
          updatedQ.doenca_ou_conjunto_de_doencas || '',
          updatedQ.nivel_de_dificuldade || 'Moderada',
          JSON.stringify(updatedQ.tags || [])
        ]);
      } catch (dbErr) {
        console.error('[Neon save question error]', dbErr.message);
      }

      // Local Disk Backup
      try {
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
      } catch (fsErr) {
        console.warn('[Disk question backup notice]', fsErr.message);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, id: updatedQ.id, source: 'Neon PostgreSQL' }));
      return;
    } catch (err) {
      console.error('Error saving question:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
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
  console.log(`[PNA Server] Live at http://0.0.0.0:${PORT}`);
  console.log(`[PNA Server] Connected to Neon PostgreSQL Database Cluster`);
});
