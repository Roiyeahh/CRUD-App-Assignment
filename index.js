require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiDoc = require('./openapi.json');
const { pool, initDb } = require('./db');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3000;

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));

//Supabase Create Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Verify Supabase connectivity. A missing table (code 42P01) still means
// the client reached the project, so only network/auth errors are fatal.
async function checkSupabase() {
  const { error } = await supabase.from('tasks').select('id').limit(1);
  const missingTable = error && (error.code === '42P01' || error.code === 'PGRST205');
  if (error && !missingTable) {
    throw new Error('Supabase connection failed: ' + error.message);
  }
}


// GET /tasks - Fetch all tasks
app.get('/tasks', async function (req, res) {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC;');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tasks/:id - Fetch single task by ID (Stage 2)
app.get('/tasks/:id', async function (req, res) {
  const id = Number(req.params.id);
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1;', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / - Root route
app.get('/', function (req, res) {
  res.json({
    name: 'Task API',
    version: '1.0',
    endpoints: ['/tasks', 'PUT /tasks/:id', 'DELETE /tasks/:id']
  });
});

// POST /tasks - Create a task
app.post('/tasks', async function (req, res) {
  const title = req.body.title;
  if (title === undefined || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and cannot be empty' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *;',
      [title.trim(), false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /tasks/:id - Update a task
app.put('/tasks/:id', async function (req, res) {
  const id = Number(req.params.id);
  const { title, done } = req.body;

  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: 'Request body must include title and/or done' });
  }
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: 'Title must be a non-empty string' });
  }
  if (done !== undefined && typeof done !== 'boolean') {
    return res.status(400).json({ error: 'Done must be a boolean' });
  }

  try {
    const existingRes = await pool.query('SELECT * FROM tasks WHERE id = $1;', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const existing = existingRes.rows[0];
    const newTitle = title !== undefined ? title.trim() : existing.title;
    const newDone = done !== undefined ? done : existing.done;

    const updateRes = await pool.query(
      'UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *;',
      [newTitle, newDone, id]
    );
    res.json(updateRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', async function (req, res) {
  const id = Number(req.params.id);
  try {
    const existingRes = await pool.query('SELECT * FROM tasks WHERE id = $1;', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1;', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /health - Health check
app.get('/health', function (req, res) {
  res.json({ status: 'okay' });
});

// Server Initialization
async function startServer() {
  await initDb();
  await checkSupabase();
  app.listen(port, function () {
    console.log('Server running and connected to Supabase');
    console.log('Example app listening on port ' + port);
  });
}

module.exports = { supabase };

startServer();