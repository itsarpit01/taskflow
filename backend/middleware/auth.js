const jwt = require('jsonwebtoken');
const { getDb } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-secret-key-change-in-prod';

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = await getDb();
    const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

async function requireProjectAccess(req, res, next) {
  const db = await getDb();
  const projectId = req.params.projectId || req.body.project_id;
  if (!projectId) return next();
  const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const membership = await db.get('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?', projectId, req.user.id);
  if (!membership && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied to this project' });
  req.project = project;
  req.projectMembership = membership;
  next();
}

function requireProjectAdmin(req, res, next) {
  if (req.user.role === 'admin') return next();
  if (!req.projectMembership || req.projectMembership.role !== 'admin') return res.status(403).json({ error: 'Project admin access required' });
  next();
}

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authenticate, requireAdmin, requireProjectAccess, requireProjectAdmin, generateToken };
