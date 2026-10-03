const mongoose = require('mongoose');
const { toLegacy } = require('../utils/legacy');
const { isObjectId } = require('../utils/ids');
const User = require('./user.model');
const Comment = require('./comment.model');

const { ObjectId } = mongoose.Schema.Types;
const STATUSES = ['todo', 'in_progress', 'review', 'done'];

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: null },
  project_id:  { type: ObjectId, ref: 'Project', required: true, index: true },
  assignee_id: { type: ObjectId, ref: 'User', default: null },
  creator_id:  { type: ObjectId, ref: 'User', required: true },
  status:      { type: String, enum: STATUSES, default: 'todo' },
  priority:    { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  // Kept as 'YYYY-MM-DD' text, exactly what <input type="date"> sends and expects.
  due_date:    { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

taskSchema.index({ assignee_id: 1, status: 1 });

const Task = mongoose.model('Task', taskSchema);
exports.Model = Task;

// Only these columns can be changed through the API.
const UPDATABLE_FIELDS = ['title', 'description', 'assignee_id', 'status', 'priority', 'due_date'];

const todayStr = () => new Date().toISOString().slice(0, 10); // same as SQLite date('now')
const toObjectIds = (ids) => ids.map((id) => new mongoose.Types.ObjectId(String(id)));

// Replaces the two LEFT JOINs to users (assignee + creator) from the SQL version.
async function withNames(tasks) {
  const users = await User.mapByIds(tasks.flatMap((t) => [t.assignee_id, t.creator_id]));
  return tasks.map((t) => ({
    ...toLegacy(t),
    assignee_name:  users.get(String(t.assignee_id))?.name  ?? null,
    assignee_email: users.get(String(t.assignee_id))?.email ?? null,
    creator_name:   users.get(String(t.creator_id))?.name   ?? null,
  }));
}

exports.findByProject = async (projectId, { status, priority, assignee_id } = {}) => {
  const filter = { project_id: projectId };
  // typeof checks stop query-injection such as ?status[$ne]=done
  if (typeof status === 'string' && status) filter.status = status;
  if (typeof priority === 'string' && priority) filter.priority = priority;
  if (assignee_id) {
    if (!isObjectId(assignee_id)) return [];
    filter.assignee_id = assignee_id;
  }
  const tasks = await Task.find(filter).sort({ created_at: -1, _id: -1 }).lean();
  return withNames(tasks);
};

exports.findById = async (taskId) => {
  if (!isObjectId(String(taskId))) return null;
  const task = await Task.findById(taskId).lean();
  return task ? (await withNames([task]))[0] : null;
};

exports.findInProject = async (taskId, projectId) => {
  if (!isObjectId(String(taskId)) || !isObjectId(String(projectId))) return null;
  return toLegacy(await Task.findOne({ _id: taskId, project_id: projectId }).lean());
};

exports.create = async ({ title, description, projectId, assigneeId, creatorId, status, priority, dueDate }) => {
  const doc = await Task.create({
    title,
    description: description || null,
    project_id: projectId,
    assignee_id: assigneeId || null,
    creator_id: creatorId,
    status: status || 'todo',
    priority,
    due_date: dueDate || null,
  });
  return exports.findById(doc._id);
};

// Returns false when there was nothing valid to update.
exports.update = async (taskId, data) => {
  const fields = {};
  for (const field of UPDATABLE_FIELDS) {
    if (data[field] !== undefined) fields[field] = data[field] === '' ? null : data[field];
  }
  if (Object.keys(fields).length === 0) return false;
  // runValidators makes Mongoose enforce the enums (status/priority) on updates too.
  // updated_at is refreshed automatically by the timestamps option.
  await Task.updateOne({ _id: taskId }, { $set: fields }, { runValidators: true });
  return true;
};

// Replaces ON DELETE CASCADE: remove the task's comments too.
exports.remove = async (taskId) => {
  await Comment.Model.deleteMany({ task_id: taskId });
  await Task.deleteOne({ _id: taskId });
};

// ---------- stats / lists used by projects + dashboard ----------

exports.countByProject = async (projectIds, { openOnly = false } = {}) => {
  const match = { project_id: { $in: toObjectIds(projectIds) } };
  if (openOnly) match.status = { $ne: 'done' };
  const rows = await Task.aggregate([
    { $match: match },
    { $group: { _id: '$project_id', n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
};

async function statusCounts(match) {
  const rows = await Task.aggregate([{ $match: match }, { $group: { _id: '$status', n: { $sum: 1 } } }]);
  const counts = { todo: 0, in_progress: 0, review: 0, done: 0 };
  for (const r of rows) counts[r._id] = r.n;
  return { ...counts, total: STATUSES.reduce((sum, s) => sum + counts[s], 0) };
}

exports.statsForProject = async (projectId) => {
  const id = new mongoose.Types.ObjectId(String(projectId));
  const [counts, overdue] = await Promise.all([
    statusCounts({ project_id: id }),
    Task.countDocuments({ project_id: id, status: { $ne: 'done' }, due_date: { $lt: todayStr() } }),
  ]);
  return { ...counts, overdue };
};

exports.statsForAssignee = (userId) =>
  statusCounts({ assignee_id: new mongoose.Types.ObjectId(String(userId)) });

exports.findOpenAssigned = async (userId, limit = 10) => {
  const tasks = await Task.find({ assignee_id: userId, status: { $ne: 'done' } })
    .sort({ due_date: 1, _id: 1 }).limit(limit).lean();
  return tasks.map(toLegacy);
};

exports.findOverdueAssigned = async (userId) => {
  const tasks = await Task.find({ assignee_id: userId, status: { $ne: 'done' }, due_date: { $lt: todayStr() } })
    .sort({ due_date: 1, _id: 1 }).lean();
  return tasks.map(toLegacy);
};

exports.findRecentInProjects = async (projectIds, limit = 8) => {
  if (projectIds.length === 0) return [];
  const tasks = await Task.find({ project_id: { $in: projectIds } })
    .sort({ updated_at: -1, _id: -1 }).limit(limit).lean();
  return tasks.map(toLegacy);
};
