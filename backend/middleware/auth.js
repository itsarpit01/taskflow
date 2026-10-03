const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const ProjectMember = require('../models/projectMember.model');
const { isObjectId } = require('../utils/ids');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-secret-key-change-in-prod';

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Tokens issued before the MongoDB migration carry a number, not an ObjectId.
    if (!isObjectId(decoded.userId)) return res.status(401).json({ error: 'Invalid token' });
    const user = await User.findPublicById(decoded.userId);
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
  try {
    const projectId = req.params.projectId || req.body.project_id;
    if (!projectId) return next();
    if (!isObjectId(String(projectId))) return res.status(404).json({ error: 'Project not found' });
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const membership = await ProjectMember.findMembership(projectId, req.user.id);
    if (!membership && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied to this project' });
    req.project = project;
    req.projectMembership = membership;
    next();
  } catch (err) {
    next(err); // handled by the global error handler in app.js
  }
}

function requireProjectAdmin(req, res, next) {
  if (req.user.role === 'admin') return next();
  if (!req.projectMembership || req.projectMembership.role !== 'admin') return res.status(403).json({ error: 'Project admin access required' });
  next();
}

function generateToken(userId) {
  return jwt.sign({ userId: String(userId) }, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authenticate, requireAdmin, requireProjectAccess, requireProjectAdmin, generateToken };
