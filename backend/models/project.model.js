const mongoose = require('mongoose');
const { toLegacy } = require('../utils/legacy');
const { isObjectId } = require('../utils/ids');
const User = require('./user.model');
const Task = require('./task.model');
const Comment = require('./comment.model');
const ProjectMember = require('./projectMember.model');

const { ObjectId } = mongoose.Schema.Types;

const projectSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: null },
  owner_id:    { type: ObjectId, ref: 'User', required: true },
  status:      { type: String, enum: ['active', 'archived'], default: 'active' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

const Project = mongoose.model('Project', projectSchema);
exports.Model = Project;

const UPDATABLE_FIELDS = ['name', 'description', 'status'];

// ---------- helpers that replace the SQL JOINs / sub-selects ----------

async function addOwnerNames(projects) {
  const owners = await User.mapByIds(projects.map((p) => p.owner_id));
  return projects.map((p) => ({ ...toLegacy(p), owner_name: owners.get(String(p.owner_id))?.name ?? null }));
}

async function addCounts(rows) {
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return rows;
  const [taskCounts, memberCounts] = await Promise.all([
    Task.countByProject(ids),
    ProjectMember.countByProject(ids),
  ]);
  return rows.map((r) => ({
    ...r,
    task_count: taskCounts.get(r.id) || 0,
    member_count: memberCounts.get(r.id) || 0,
  }));
}

const newestFirst = { created_at: -1, _id: -1 };

// ---------- queries ----------

exports.findById = async (id) => {
  if (!isObjectId(String(id))) return null;
  return toLegacy(await Project.findById(id).lean());
};

exports.listAllWithCounts = async () => {
  const projects = await Project.find().sort(newestFirst).lean();
  return addCounts(await addOwnerNames(projects));
};

exports.listForUser = async (userId) => {
  const memberships = await ProjectMember.listByUser(userId);
  const roleByProject = new Map(memberships.map((m) => [String(m.project_id), m.role]));
  const projects = await Project.find({ _id: { $in: memberships.map((m) => m.project_id) } })
    .sort(newestFirst).lean();
  const rows = await addCounts(await addOwnerNames(projects));
  return rows.map((r) => ({ ...r, my_role: roleByProject.get(r.id) }));
};

// Dashboard "my projects": active only, newest 5, with number of open tasks.
exports.listActiveForDashboard = async (user, limit = 5) => {
  const filter = { status: 'active' };
  if (user.role !== 'admin') {
    const memberships = await ProjectMember.listByUser(user.id);
    filter._id = { $in: memberships.map((m) => m.project_id) };
  }
  const projects = await Project.find(filter).sort(newestFirst).limit(limit).lean();
  const rows = await addOwnerNames(projects);
  const open = rows.length ? await Task.countByProject(rows.map((r) => r.id), { openOnly: true }) : new Map();
  return rows.map((r) => ({ ...r, open_tasks: open.get(r.id) || 0 }));
};

// Map of projectId(string) -> project name.
exports.mapNamesByIds = async (ids) => {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (unique.length === 0) return new Map();
  const projects = await Project.find({ _id: { $in: unique } }).select('name').lean();
  return new Map(projects.map((p) => [String(p._id), p.name]));
};

// ---------- commands ----------

exports.create = async ({ name, description, ownerId }) => {
  const doc = await Project.create({ name, description: description || null, owner_id: ownerId });
  await ProjectMember.upsert(doc._id, ownerId, 'admin'); // the creator becomes project admin
  return toLegacy(doc.toObject());
};

// Returns false when there was nothing valid to update.
exports.update = async (id, data) => {
  const fields = {};
  for (const field of UPDATABLE_FIELDS) {
    if (data[field] !== undefined) fields[field] = data[field];
  }
  if (Object.keys(fields).length === 0) return false;
  await Project.updateOne({ _id: id }, { $set: fields }, { runValidators: true });
  return true;
};

// Replaces ON DELETE CASCADE: remove everything that belongs to the project.
exports.remove = async (id) => {
  const tasks = await Task.Model.find({ project_id: id }).select('_id').lean();
  await Comment.Model.deleteMany({ task_id: { $in: tasks.map((t) => t._id) } });
  await Task.Model.deleteMany({ project_id: id });
  await ProjectMember.Model.deleteMany({ project_id: id });
  await Project.deleteOne({ _id: id });
};
