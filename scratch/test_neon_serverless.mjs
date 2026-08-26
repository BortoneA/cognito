import { neon } from '@neondatabase/serverless';

const CONNECTION_STRING = 'postgresql://neondb_owner:npg_z2qTrQUdL1fO@ep-twilight-rain-ax35ff12-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

const sql = neon(CONNECTION_STRING);

async function testNeon() {
  console.log('Testing @neondatabase/serverless HTTP direct query...');
  const countResult = await sql`SELECT COUNT(*) FROM questoes;`;
  console.log('Total questions in Neon via HTTP direct query:', countResult);

  const progressResult = await sql`SELECT user_id, updated_at FROM user_progress WHERE user_id = 'default_user';`;
  console.log('User progress in Neon via HTTP direct query:', progressResult);
}

testNeon().catch(console.error);
