const mongoose = require('mongoose');
const { toLegacy } = require('../utils/legacy');
const { isObjectId } = require('../utils/ids');
const User = require('./user.model');

const { ObjectId } = mongoose.Schema.Types;

const memberSchema = new mongoose.Schema({
  project_id: { type: ObjectId, ref: 'Project', required: true },
  user_id:    { type: ObjectId, ref: 'User', required: true },
  role:       { type: String, enum: ['admin', 'member'], default: 'member' },
}, { timestamps: { createdAt: 'joined_at', updatedAt: false } });

// Same rule as the old UNIQUE(project_id, user_id): a user joins a project once.
memberSchema.index({ project_id: 1, user_id: 1 }, { unique: true });
memberSchema.index({ user_id: 1 });

const ProjectMember = mongoose.model('ProjectMember', memberSchema, 'project_members');
exports.Model = ProjectMember;

exports.findMembership = async (projectId, userId) => {
  if (!isObjectId(String(projectId)) || !isObjectId(String(userId))) return null;
  return toLegacy(await ProjectMember.findOne({ project_id: projectId, user_id: userId }).lean());
};

// Raw memberships of a user (used internally to find "my projects").
exports.listByUser = (userId) => ProjectMember.find({ user_id: userId }).lean();

// Members of a project, joined with their user info (replaces the SQL JOIN).
exports.listByProject = async (projectId) => {
  const rows = await ProjectMember.find({ project_id: projectId }).sort({ _id: 1 }).lean();
  const users = await User.mapByIds(rows.map((r) => r.user_id));
  return rows
    .filter((r) => users.has(String(r.user_id)))
    .map((r) => {
      const u = users.get(String(r.user_id));
      return { project_role: r.role, id: String(r.user_id), name: u.name, email: u.email, role: u.role };
    });
};

// Replaces INSERT OR REPLACE: add the member, or update their role if already in.
exports.upsert = (projectId, userId, role = 'member') =>
  ProjectMember.updateOne(
    { project_id: projectId, user_id: userId },
    { $set: { role } },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

exports.remove = (projectId, userId) =>
  ProjectMember.deleteMany({ project_id: projectId, user_id: userId });

exports.countByProject = async (projectIds) => {
  const ids = projectIds.map((id) => new mongoose.Types.ObjectId(String(id)));
  const rows = await ProjectMember.aggregate([
    { $match: { project_id: { $in: ids } } },
    { $group: { _id: '$project_id', n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
};
