const Task = require('../models/task.model');
const Comment = require('../models/comment.model');

exports.list = async (req, res) => {
  try {
    const { status, priority, assignee_id } = req.query;
    const tasks = await Task.findByProject(req.params.projectId, { status, priority, assignee_id });
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load tasks' });
  }
};

exports.create = async (req, res) => {
  const { title, description, assignee_id, priority = 'medium', due_date } = req.body;
  try {
    const task = await Task.create({
      title,
      description,
      projectId: req.params.projectId,
      assigneeId: assignee_id,
      creatorId: req.user.id,
      priority,
      dueDate: due_date,
    });
    res.status(201).json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

exports.update = async (req, res) => {
  const { projectId, taskId } = req.params;
  try {
    const existing = await Task.findInProject(taskId, projectId);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const changed = await Task.update(taskId, req.body);
    if (!changed) return res.status(400).json({ error: 'No updates' });

    res.json({ task: await Task.findById(taskId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

exports.remove = async (req, res) => {
  const { projectId, taskId } = req.params;
  try {
    const existing = await Task.findInProject(taskId, projectId);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    await Task.remove(taskId);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

exports.listComments = async (req, res) => {
  try {
    const comments = await Comment.findByTask(req.params.taskId);
    res.json({ comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load comments' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const comment = await Comment.create({
      taskId: req.params.taskId,
      userId: req.user.id,
      content: req.body.content,
    });
    res.status(201).json({ comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};
