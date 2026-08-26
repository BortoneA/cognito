import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_z2qTrQUdL1fO@ep-twilight-rain-ax35ff12-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require');

async function checkQuestions() {
  const count = await sql`SELECT count(*) FROM questoes;`;
  console.log('TOTAL_QUESTOES:', count[0].count);

  const areas = await sql`SELECT area, count(*) as total FROM questoes GROUP BY area ORDER BY total DESC;`;
  console.log('\nDISTRIBUICAO_AREAS:');
  areas.forEach(a => console.log(`- ${a.area}: ${a.total} questões`));

  const anos = await sql`SELECT ano_da_prova, count(*) as total FROM questoes GROUP BY ano_da_prova ORDER BY ano_da_prova DESC;`;
  console.log('\nDISTRIBUICAO_ANOS:');
  anos.forEach(a => console.log(`- Ano ${a.ano_da_prova}: ${a.total} questões`));
}

checkQuestions().catch(console.error);
