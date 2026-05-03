const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    const myTasks = await db.all(`SELECT t.*, p.name as project_name FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = ? AND t.status != 'done' ORDER BY t.due_date ASC LIMIT 10`, userId);
    const overdueTasks = await db.all(`SELECT t.*, p.name as project_name FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = ? AND t.status != 'done' AND t.due_date < date('now') ORDER BY t.due_date ASC`, userId);
    let myProjects;
    if (req.user.role === 'admin') {
      myProjects = await db.all(`SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status != 'done') as open_tasks
        FROM projects p JOIN users u ON p.owner_id = u.id WHERE p.status = 'active' ORDER BY p.created_at DESC LIMIT 5`);
    } else {
      myProjects = await db.all(`SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status != 'done') as open_tasks
        FROM projects p JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
        JOIN users u ON p.owner_id = u.id WHERE p.status = 'active' ORDER BY p.created_at DESC LIMIT 5`, userId);
    }
    const taskStats = await db.get(`SELECT
      SUM(CASE WHEN status='todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status='review' THEN 1 ELSE 0 END) as review,
      SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done,
      COUNT(*) as total FROM tasks WHERE assignee_id = ?`, userId);
    const recentActivity = await db.all(`SELECT t.*, p.name as project_name FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
      ORDER BY t.updated_at DESC LIMIT 8`, userId);
    res.json({ myTasks, overdueTasks, myProjects, taskStats, recentActivity });
  } catch (err) { res.status(500).json({ error: 'Failed to load dashboard' }); }
});

router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json({ users });
  } catch (err) { res.status(500).json({ error: 'Failed to load users' }); }
});

router.put('/users/:userId/role', authenticate, requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const db = await getDb();
    await db.run('UPDATE users SET role = ? WHERE id = ?', role, req.params.userId);
    const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', req.params.userId);
    res.json({ user });
  } catch (err) { res.status(500).json({ error: 'Failed to update role' }); }
});

module.exports = router;
