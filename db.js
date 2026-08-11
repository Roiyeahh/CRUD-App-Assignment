const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:dev@localhost:5432/tasks',
});

async function initDb() {
  const client = await pool.connect();
  try {
    // 1. Create table with Postgres types (id SERIAL, done BOOLEAN)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);

    // 2. Check if table is empty
    const countRes = await client.query('SELECT COUNT(*) FROM tasks;');
    const count = parseInt(countRes.rows[0].count, 10);

    // 3. Seed 3 initial tasks only if empty
    if (count === 0) {
      await client.query(`
        INSERT INTO tasks (title, done) VALUES
        ('Finish the task', false),
        ('Go to the gym', false),
        ('Complete week 1', true);
      `);
      console.log('Database initialized and seeded.');
    }
  } finally {
    client.release();
  }
}

module.exports = { pool, initDb };