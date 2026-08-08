const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiDoc = require('./openapi.json');
const Database = require('better-sqlite3');

const app = express();
const port = 3000;

const db = new Database('tasks.db');

db.exec('CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0)');

const rowCount = db.prepare('SELECT COUNT(*) AS count FROM tasks').get();
if (rowCount.count === 0) {
  db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)').run('Finish the task', 0);
  db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)').run('Go to the gym', 0);
  db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)').run('Complete week 1', 1);
}

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));

app.get('/tasks', function (req, res) {
  const tasks = db.prepare('SELECT * FROM tasks').all();
  res.json(tasks);
});

app.get('/tasks/:id', function (req, res) {
  const id = Number(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (task === undefined) {
    res.status(404).json({ error: 'Task ' + id + ' not found' });
    return;
  }
  res.json(task);
});

app.get('/', function (req, res) {
  res.json({
    name: 'Task API',
    version: '1.0',
    endpoints: ['/tasks', 'PUT /tasks/:id', 'DELETE /tasks/:id']
  });
});

app.post('/tasks', function (req, res) {
  const title = req.body.title;
  if (title === undefined || title.trim() === '') {
    res.status(400).json({ error: 'Title is required and cannot be empty' });
    return;
  }
  const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  const result = insert.run(title.trim(), 0);
  const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newTask);
});

app.put('/tasks/:id', function (req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (existing === undefined) {
    res.status(404).json({ error: 'Task ' + id + ' not found' });
    return;
  }
  const title = req.body.title;
  const done = req.body.done;
  if (title === undefined && done === undefined) {
    res.status(400).json({ error: 'Request body must include title and/or done' });
    return;
  }
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    res.status(400).json({ error: 'Title must be a non-empty string' });
    return;
  }
  if (done !== undefined && typeof done !== 'boolean') {
    res.status(400).json({ error: 'Done must be a boolean' });
    return;
  }
  let newTitle = existing.title;
  let newDone = existing.done;
  if (title !== undefined) {
    newTitle = title.trim();
  }
  if (done !== undefined) {
    if (done === true) {
      newDone = 1;
    } else {
      newDone = 0;
    }
  }
  const update = db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?');
  update.run(newTitle, newDone, id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(updated);
});

app.delete('/tasks/:id', function (req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (existing === undefined) {
    res.status(404).json({ error: 'Task ' + id + ' not found' });
    return;
  }
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.status(204).send();
});

app.get('/health', function (req, res) {
  res.json({ status: 'okay' });
});

app.listen(port, function () {
  console.log('Example app listening on port ' + port);
});
