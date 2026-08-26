import pg from 'pg';

const { Pool } = pg;

const CONNECTION_STRING = 'postgresql://neondb_owner:npg_z2qTrQUdL1fO@ep-twilight-rain-ax35ff12-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

async function fixTable() {
  const client = await pool.connect();
  try {
    console.log('--- REESTRUTURANDO TABELA FLASHCARDS NO NEON ---');
    await client.query(`
      DROP TABLE IF EXISTS flashcards;

      CREATE TABLE flashcards (
        id VARCHAR(50) PRIMARY KEY,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        area VARCHAR(100) DEFAULT 'Clínica Médica',
        subarea VARCHAR(255) DEFAULT 'Geral',
        theme VARCHAR(255) DEFAULT 'Conceito Clínico',
        tags JSONB DEFAULT '[]'::jsonb,
        interval INTEGER DEFAULT 0,
        repetitions INTEGER DEFAULT 0,
        ease_factor REAL DEFAULT 2.5,
        due_date BIGINT,
        last_reviewed BIGINT,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_flashcards_area ON flashcards(area);
      CREATE INDEX IF NOT EXISTS idx_flashcards_subarea ON flashcards(subarea);
      CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards(due_date);
    `);
    console.log('✅ Tabela `flashcards` reestruturada com sucesso no Neon PostgreSQL!');
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixTable();
