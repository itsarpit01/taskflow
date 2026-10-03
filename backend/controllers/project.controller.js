const Project = require('../models/project.model');
const ProjectMember = require('../models/projectMember.model');
const Task = require('../models/task.model');
const User = require('../models/user.model');

exports.list = async (req, res) => {
  try {
    const projects = req.user.role === 'admin'
      ? await Project.listAllWithCounts()
      : await Project.listForUser(req.user.id);
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load projects' });
  }
};

exports.create = async (req, res) => {
  const { name, description } = req.body;
  try {
    const project = await Project.create({ name, description, ownerId: req.user.id });
    res.status(201).json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

exports.get = async (req, res) => {
  try {
    const { projectId } = req.params;
    const [members, stats] = await Promise.all([
      ProjectMember.listByProject(projectId),
      Task.statsForProject(projectId),
    ]);
    res.json({ project: req.project, members, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load project' });
  }
};

exports.update = async (req, res) => {
  const { projectId } = req.params;
  try {
    const changed = await Project.update(projectId, req.body);
    if (!changed) return res.status(400).json({ error: 'No updates' });
    res.json({ project: await Project.findById(projectId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
};

exports.remove = async (req, res) => {
  try {
    await Project.remove(req.params.projectId);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
};

exports.addMember = async (req, res) => {
  const { email, role = 'member' } = req.body;
  try {
    const user = await User.findPublicByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await ProjectMember.upsert(req.params.projectId, user.id, role);
    res.json({ message: 'Member added', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    await ProjectMember.remove(req.params.projectId, req.params.userId);
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};
