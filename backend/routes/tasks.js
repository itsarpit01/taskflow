const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

router.get('/', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const db = await getDb();
    const { status, priority, assignee_id } = req.query;
    let query = `SELECT t.*, u_assign.name as assignee_name, u_assign.email as assignee_email, u_creator.name as creator_name
      FROM tasks t LEFT JOIN users u_assign ON t.assignee_id = u_assign.id
      LEFT JOIN users u_creator ON t.creator_id = u_creator.id WHERE t.project_id = ?`;
    const params = [req.params.projectId];
    if (status) { query += ' AND t.status = ?'; params.push(status); }
    if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
    if (assignee_id) { query += ' AND t.assignee_id = ?'; params.push(assignee_id); }
    query += ' ORDER BY t.created_at DESC';
    const tasks = await db.all(query, ...params);
    res.json({ tasks });
  } catch (err) { res.status(500).json({ error: 'Failed to load tasks' }); }
});

router.post('/', authenticate, requireProjectAccess, [
  body('title').trim().notEmpty(),
  body('assignee_id').optional().isInt(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('due_date').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { title, description, assignee_id, priority = 'medium', due_date } = req.body;
  try {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO tasks (title, description, project_id, assignee_id, creator_id, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      title, description || null, req.params.projectId, assignee_id || null, req.user.id, priority, due_date || null
    );
    const task = await db.get(`SELECT t.*, u_assign.name as assignee_name, u_creator.name as creator_name
      FROM tasks t LEFT JOIN users u_assign ON t.assignee_id = u_assign.id
      LEFT JOIN users u_creator ON t.creator_id = u_creator.id WHERE t.id = ?`, result.lastID);
    res.status(201).json({ task });
  } catch (err) { res.status(500).json({ error: 'Failed to create task' }); }
});

router.put('/:taskId', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const db = await getDb();
    const task = await db.get('SELECT * FROM tasks WHERE id = ? AND project_id = ?', req.params.taskId, req.params.projectId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const allowed = ['title', 'description', 'assignee_id', 'status', 'priority', 'due_date'];
    const updates = []; const params = [];
    for (const field of allowed) {
      if (req.body[field] !== undefined) { updates.push(`${field} = ?`); params.push(req.body[field] === '' ? null : req.body[field]); }
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No updates' });
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.taskId);
    await db.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, ...params);
    const updated = await db.get(`SELECT t.*, u_assign.name as assignee_name, u_creator.name as creator_name
      FROM tasks t LEFT JOIN users u_assign ON t.assignee_id = u_assign.id
      LEFT JOIN users u_creator ON t.creator_id = u_creator.id WHERE t.id = ?`, req.params.taskId);
    res.json({ task: updated });
  } catch (err) { res.status(500).json({ error: 'Failed to update task' }); }
});

router.delete('/:taskId', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const db = await getDb();
    const task = await db.get('SELECT * FROM tasks WHERE id = ? AND project_id = ?', req.params.taskId, req.params.projectId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await db.run('DELETE FROM tasks WHERE id = ?', req.params.taskId);
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete task' }); }
});

router.get('/:taskId/comments', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const db = await getDb();
    const comments = await db.all(`SELECT tc.*, u.name as user_name FROM task_comments tc
      JOIN users u ON tc.user_id = u.id WHERE tc.task_id = ? ORDER BY tc.created_at ASC`, req.params.taskId);
    res.json({ comments });
  } catch (err) { res.status(500).json({ error: 'Failed to load comments' }); }
});

router.post('/:taskId/comments', authenticate, requireProjectAccess, [body('content').trim().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const db = await getDb();
    const result = await db.run('INSERT INTO task_comments (task_id, user_id, content) VALUES (?, ?, ?)', req.params.taskId, req.user.id, req.body.content);
    const comment = await db.get(`SELECT tc.*, u.name as user_name FROM task_comments tc
      JOIN users u ON tc.user_id = u.id WHERE tc.id = ?`, result.lastID);
    res.status(201).json({ comment });
  } catch (err) { res.status(500).json({ error: 'Failed to add comment' }); }
});

module.exports = router;
