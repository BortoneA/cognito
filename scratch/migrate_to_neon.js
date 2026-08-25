import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONNECTION_STRING = 'postgresql://neondb_owner:npg_z2qTrQUdL1fO@ep-twilight-rain-ax35ff12-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('--- CONECTANDO AO BANCO DE DADOS NEON POSTGRESQL ---');
  const client = await pool.connect();
  console.log('✓ Conexão estabelecida com sucesso com o cluster Neon!');

  try {
    console.log('--- CRIANDO TABELAS NO NEON ---');

    // 1. Tabela de Questões
    await client.query(`
      CREATE TABLE IF NOT EXISTS questoes (
        id VARCHAR(50) PRIMARY KEY,
        ano_da_prova INTEGER,
        numero INTEGER,
        enunciado TEXT NOT NULL,
        alternativas JSONB NOT NULL,
        resposta_correta VARCHAR(10) NOT NULL,
        explicacao TEXT,
        area VARCHAR(100),
        subarea VARCHAR(255),
        doenca_ou_conjunto_de_doencas VARCHAR(255),
        nivel_de_dificuldade VARCHAR(50),
        tags JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_questoes_area ON questoes(area);
      CREATE INDEX IF NOT EXISTS idx_questoes_subarea ON questoes(subarea);
      CREATE INDEX IF NOT EXISTS idx_questoes_ano ON questoes(ano_da_prova);
    `);
    console.log('✓ Tabela `questoes` e índices prontos.');

    // 2. Tabela de Progresso e Desempenho do Usuário
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_progress (
        user_id VARCHAR(50) PRIMARY KEY DEFAULT 'default_user',
        answers JSONB DEFAULT '{}'::jsonb,
        saved_questions JSONB DEFAULT '{}'::jsonb,
        notes JSONB DEFAULT '{}'::jsonb,
        exam_history JSONB DEFAULT '[]'::jsonb,
        daily_activity JSONB DEFAULT '{}'::jsonb,
        unlocked_badges JSONB DEFAULT '{}'::jsonb,
        highlighter_color VARCHAR(20) DEFAULT 'yellow',
        daily_goal INTEGER DEFAULT 20,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ Tabela `user_progress` pronta.');

    // 3. Tabela de Flashcards
    await client.query(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id VARCHAR(50) PRIMARY KEY,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        area VARCHAR(100),
        subarea VARCHAR(255),
        interval INTEGER DEFAULT 1,
        repetition INTEGER DEFAULT 0,
        efactor REAL DEFAULT 2.5,
        next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ Tabela `flashcards` pronta.');

    // Ingestão das 5.073 questões
    const jsonPath = path.join(__dirname, '..', 'src', 'data', 'banco_questoes_pna.json');
    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const questoes = rawData.questoes || [];

    console.log(`\n--- INICIANDO MIGRAÇÃO DE ${questoes.length} QUESTÕES PARA O NEON ---`);

    const BATCH_SIZE = 100;
    let inserted = 0;

    for (let i = 0; i < questoes.length; i += BATCH_SIZE) {
      const batch = questoes.slice(i, i + BATCH_SIZE);

      await client.query('BEGIN');
      for (const q of batch) {
        await client.query(`
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
          q.id,
          q.ano_da_prova || null,
          q.numero || null,
          q.enunciado || '',
          JSON.stringify(q.alternativas || {}),
          q.resposta_correta || 'A',
          q.explicacao || '',
          q.area || 'Outros',
          q.subarea || 'Geral',
          q.doenca_ou_conjunto_de_doencas || '',
          q.nivel_de_dificuldade || 'Moderada',
          JSON.stringify(q.tags || [])
        ]);
        inserted++;
      }
      await client.query('COMMIT');
      process.stdout.write(`\rMapeadas e gravadas no Neon: ${inserted} de ${questoes.length} questões...`);
    }

    console.log(`\n✅ Sucesso! ${inserted} questões migradas para o Neon PostgreSQL!`);

    // Ingestão do progresso existente
    const progressPath = path.join(__dirname, '..', 'src', 'data', 'user_progress_pna.json');
    if (fs.existsSync(progressPath)) {
      const prog = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
      await client.query(`
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
        JSON.stringify(prog.answers || {}),
        JSON.stringify(prog.savedQuestions || {}),
        JSON.stringify(prog.notes || {}),
        JSON.stringify(prog.examHistory || []),
        JSON.stringify(prog.dailyActivity || {}),
        JSON.stringify(prog.unlockedBadges || {}),
        prog.highlighterColor || 'yellow',
        prog.dailyGoal || 20
      ]);
      console.log('✓ Progresso do usuário migrado para a tabela `user_progress` no Neon!');
    }

    const countRes = await client.query('SELECT COUNT(*) FROM questoes;');
    console.log(`\n🎉 VERIFICAÇÃO FINAL: O Neon PostgreSQL agora contém ${countRes.rows[0].count} questões ativas!`);

  } catch (err) {
    console.error('❌ Erro durante a migração:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
