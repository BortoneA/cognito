/**
 * Neon PostgreSQL Direct Database Service (Client & Server Universal Driver)
 * 
 * Directly connects to Neon PostgreSQL over HTTPS via @neondatabase/serverless.
 * Operates independently of VPS web server configuration (Nginx, Docker, PM2, Vercel, Static).
 */
import { neon } from '@neondatabase/serverless';

export const NEON_CONNECTION_STRING = 'postgresql://neondb_owner:npg_z2qTrQUdL1fO@ep-twilight-rain-ax35ff12-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

// Initialize HTTP SQL Client
const sql = neon(NEON_CONNECTION_STRING);

/**
 * 1. Fetch all questions directly from Neon PostgreSQL Cloud
 */
export const loadAllQuestionsFromNeon = async () => {
  try {
    const rows = await sql`
      SELECT 
        id, ano_da_prova, numero, enunciado, alternativas, resposta_correta,
        explicacao, area, subarea, doenca_ou_conjunto_de_doencas, nivel_de_dificuldade, tags, updated_at
      FROM questoes 
      ORDER BY ano_da_prova DESC, numero ASC;
    `;
    if (rows && rows.length > 0) {
      return { success: true, count: rows.length, questoes: rows };
    }
    return { success: false, error: 'Neon retornou 0 questões' };
  } catch (err) {
    console.error('[Neon DB Service] Erro ao carregar questões:', err);
    return { success: false, error: err.message };
  }
};

/**
 * 2. Save or edit a question directly in Neon PostgreSQL Cloud
 */
export const saveQuestionToNeon = async (q) => {
  if (!q || !q.id) return { success: false, error: 'ID da questão obrigatório' };
  try {
    const alternativasJson = typeof q.alternativas === 'string' ? q.alternativas : JSON.stringify(q.alternativas || {});
    const tagsJson = typeof q.tags === 'string' ? q.tags : JSON.stringify(q.tags || []);

    await sql`
      INSERT INTO questoes (
        id, ano_da_prova, numero, enunciado, alternativas, resposta_correta,
        explicacao, area, subarea, doenca_ou_conjunto_de_doencas, nivel_de_dificuldade, tags, updated_at
      ) VALUES (
        ${q.id},
        ${q.ano_da_prova || null},
        ${q.numero || null},
        ${q.enunciado || ''},
        ${alternativasJson}::jsonb,
        ${q.resposta_correta || 'A'},
        ${q.explicacao || ''},
        ${q.area || 'Outros'},
        ${q.subarea || 'Geral'},
        ${q.doenca_ou_conjunto_de_doencas || ''},
        ${q.nivel_de_dificuldade || 'Moderada'},
        ${tagsJson}::jsonb,
        NOW()
      )
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
    `;
    return { success: true, id: q.id };
  } catch (err) {
    console.error('[Neon DB Service] Erro ao salvar questão:', err);
    return { success: false, error: err.message };
  }
};

/**
 * 3. Load user progress directly from Neon PostgreSQL Cloud
 */
export const loadUserProgressFromNeon = async (userId = 'default_user') => {
  try {
    const rows = await sql`
      SELECT user_id, answers, saved_questions, notes, exam_history, daily_activity, unlocked_badges, highlighter_color, daily_goal, updated_at
      FROM user_progress 
      WHERE user_id = ${userId} 
      LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        success: true,
        data: {
          updatedAt: r.updated_at,
          answers: r.answers || {},
          savedQuestions: r.saved_questions || {},
          notes: r.notes || {},
          examHistory: r.exam_history || [],
          dailyActivity: r.daily_activity || {},
          unlockedBadges: r.unlocked_badges || {},
          highlighterColor: r.highlighter_color || 'yellow',
          dailyGoal: r.daily_goal || 20
        }
      };
    }
    return { success: false, empty: true };
  } catch (err) {
    console.error('[Neon DB Service] Erro ao carregar progresso:', err);
    return { success: false, error: err.message };
  }
};

/**
 * 4. Save user progress directly to Neon PostgreSQL Cloud
 */
export const saveUserProgressToNeon = async (progressData, userId = 'default_user') => {
  if (!progressData) return { success: false, error: 'Dados vazios' };
  try {
    const answersJson = JSON.stringify(progressData.answers || {});
    const savedJson = JSON.stringify(progressData.savedQuestions || {});
    const notesJson = JSON.stringify(progressData.notes || {});
    const examJson = JSON.stringify(progressData.examHistory || []);
    const dailyJson = JSON.stringify(progressData.dailyActivity || {});
    const badgesJson = JSON.stringify(progressData.unlockedBadges || {});

    await sql`
      INSERT INTO user_progress (
        user_id, answers, saved_questions, notes, exam_history, daily_activity, unlocked_badges, highlighter_color, daily_goal, updated_at
      ) VALUES (
        ${userId},
        ${answersJson}::jsonb,
        ${savedJson}::jsonb,
        ${notesJson}::jsonb,
        ${examJson}::jsonb,
        ${dailyJson}::jsonb,
        ${badgesJson}::jsonb,
        ${progressData.highlighterColor || 'yellow'},
        ${progressData.dailyGoal || 20},
        NOW()
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
    `;
    return { success: true, savedAt: new Date().toISOString() };
  } catch (err) {
    console.error('[Neon DB Service] Erro ao salvar progresso:', err);
    return { success: false, error: err.message };
  }
};

/**
 * 5. Load flashcards directly from Neon PostgreSQL Cloud
 */
export const loadFlashcardsFromNeon = async () => {
  try {
    const rows = await sql`
      SELECT id, front, back, area, subarea, theme, tags, interval, repetitions, ease_factor, due_date, last_reviewed, status, updated_at
      FROM flashcards 
      ORDER BY updated_at DESC;
    `;
    if (rows) {
      const cards = rows.map(r => ({
        id: r.id,
        front: r.front,
        back: r.back,
        area: r.area,
        subarea: r.subarea,
        theme: r.theme,
        tags: r.tags || [],
        interval: r.interval || 0,
        repetitions: r.repetitions || 0,
        easeFactor: r.ease_factor || 2.5,
        dueDate: r.due_date ? Number(r.due_date) : Date.now(),
        lastReviewed: r.last_reviewed ? Number(r.last_reviewed) : null,
        status: r.status || 'new'
      }));
      return { success: true, flashcards: cards };
    }
    return { success: true, flashcards: [] };
  } catch (err) {
    console.error('[Neon DB Service] Erro ao carregar flashcards:', err);
    return { success: false, error: err.message };
  }
};

/**
 * 6. Save flashcards directly to Neon PostgreSQL Cloud
 */
export const saveFlashcardsToNeon = async (cards = []) => {
  try {
    for (const c of cards) {
      const tagsJson = JSON.stringify(c.tags || []);
      await sql`
        INSERT INTO flashcards (
          id, front, back, area, subarea, theme, tags, interval, repetitions, ease_factor, due_date, last_reviewed, status, updated_at
        ) VALUES (
          ${c.id},
          ${c.front || ''},
          ${c.back || ''},
          ${c.area || 'Clínica Médica'},
          ${c.subarea || 'Geral'},
          ${c.theme || 'Conceito Clínico'},
          ${tagsJson}::jsonb,
          ${c.interval || 0},
          ${c.repetitions || 0},
          ${c.easeFactor || 2.5},
          ${c.dueDate || Date.now()},
          ${c.lastReviewed || null},
          ${c.status || 'new'},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          front = EXCLUDED.front,
          back = EXCLUDED.back,
          area = EXCLUDED.area,
          subarea = EXCLUDED.subarea,
          theme = EXCLUDED.theme,
          tags = EXCLUDED.tags,
          interval = EXCLUDED.interval,
          repetitions = EXCLUDED.repetitions,
          ease_factor = EXCLUDED.ease_factor,
          due_date = EXCLUDED.due_date,
          last_reviewed = EXCLUDED.last_reviewed,
          status = EXCLUDED.status,
          updated_at = NOW();
      `;
    }
    return { success: true, count: cards.length };
  } catch (err) {
    console.error('[Neon DB Service] Erro ao salvar flashcards:', err);
    return { success: false, error: err.message };
  }
};
