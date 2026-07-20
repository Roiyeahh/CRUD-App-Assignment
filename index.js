const express = require('express');
const app = express();
const port = 3000;

const tasks = [
  {id: 1, title: "Finish the task", status: false},
  {id: 2, title: "Go to the gym", status: false},
  {id: 3, title: "Complete week 1", status: true}
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

app.post('/tasks', (req, res) => {
  res.json({title: "buy milk"});
  
});

app.get('/', (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: "[/tasks]"
  });
});

app.get('/health', (req, res) => {
  res.json({status: "okay"});
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
