const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

const tasks = [
  {id: 1, title: "Finish the task", done: false},
  {id: 2, title: "Go to the gym", done: false},
  {id: 3, title: "Complete week 1", done: true}
];

app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.get('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const requestedTask = tasks.find((task) => task.id === id);
  if (!requestedTask) {
    return res.status(404).json({error: `Task ${id} not found` });
  }
  res.json(requestedTask);
});

app.get('/', (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks", "PUT /tasks/:id", "DELETE /tasks/:id"]
  });
});

app.post('/tasks', (req, res) => {
  const { title } = req.body;
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required and cannot be empty" });
  }
  const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

  const newTask = {
    id: newId,
    title: title.trim(),
    done: false // New tasks start out NOT done
  };

  tasks.push(newTask);

  res.status(201).json(newTask);
});

app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }
  const { title, done } = req.body;
  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: "Request body must include title and/or done" });
  }
  if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
    return res.status(400).json({ error: "Title must be a non-empty string" });
  }
  if (done !== undefined && typeof done !== "boolean") {
    return res.status(400).json({ error: "Done must be a boolean" });
  }
  if (title !== undefined) tasks[index].title = title.trim();
  if (done !== undefined) tasks[index].done = done;
  res.json(tasks[index]);
});

app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }
  tasks.splice(index, 1);
  res.status(204).send();
});


app.get('/health', (req, res) => {
  res.json({status: "okay"});
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
