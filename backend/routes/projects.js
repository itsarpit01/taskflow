const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db');
const { authenticate, requireProjectAccess, requireProjectAdmin } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    let projects;
    if (req.user.role === 'admin') {
      projects = await db.all(`SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
        FROM projects p JOIN users u ON p.owner_id = u.id ORDER BY p.created_at DESC`);
    } else {
      projects = await db.all(`SELECT p.*, u.name as owner_name, pm.role as my_role,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
        FROM projects p
        JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
        JOIN users u ON p.owner_id = u.id ORDER BY p.created_at DESC`, req.user.id);
    }
    res.json({ projects });
  } catch (err) { res.status(500).json({ error: 'Failed to load projects' }); }
});

router.post('/', authenticate, [body('name').trim().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, description } = req.body;
  try {
    const db = await getDb();
    const result = await db.run('INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)', name, description || null, req.user.id);
    await db.run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', result.lastID, req.user.id, 'admin');
    const project = await db.get('SELECT * FROM projects WHERE id = ?', result.lastID);
    res.status(201).json({ project });
  } catch (err) { res.status(500).json({ error: 'Failed to create project' }); }
});

router.get('/:projectId', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const db = await getDb();
    const members = await db.all(`SELECT pm.role as project_role, u.id, u.name, u.email, u.role
      FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?`, req.params.projectId);
    const stats = await db.get(`SELECT COUNT(*) as total,
      SUM(CASE WHEN status='todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status='review' THEN 1 ELSE 0 END) as review,
      SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN due_date < date('now') AND status != 'done' THEN 1 ELSE 0 END) as overdue
      FROM tasks WHERE project_id = ?`, req.params.projectId);
    res.json({ project: req.project, members, stats });
  } catch (err) { res.status(500).json({ error: 'Failed to load project' }); }
});

router.put('/:projectId', authenticate, requireProjectAccess, requireProjectAdmin, async (req, res) => {
  const { name, description, status } = req.body;
  const updates = []; const params = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (updates.length === 0) return res.status(400).json({ error: 'No updates' });
  params.push(req.params.projectId);
  try {
    const db = await getDb();
    await db.run(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, ...params);
    const project = await db.get('SELECT * FROM projects WHERE id = ?', req.params.projectId);
    res.json({ project });
  } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

router.delete('/:projectId', authenticate, requireProjectAccess, requireProjectAdmin, async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM projects WHERE id = ?', req.params.projectId);
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

router.post('/:projectId/members', authenticate, requireProjectAccess, requireProjectAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'member'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, role = 'member' } = req.body;
  try {
    const db = await getDb();
    const user = await db.get('SELECT id, name, email, role FROM users WHERE email = ?', email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await db.run('INSERT OR REPLACE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', req.params.projectId, user.id, role);
    res.json({ message: 'Member added', user });
  } catch (err) { res.status(500).json({ error: 'Failed to add member' }); }
});

router.delete('/:projectId/members/:userId', authenticate, requireProjectAccess, requireProjectAdmin, async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', req.params.projectId, req.params.userId);
    res.json({ message: 'Member removed' });
  } catch (err) { res.status(500).json({ error: 'Failed to remove member' }); }
});

module.exports = router;
