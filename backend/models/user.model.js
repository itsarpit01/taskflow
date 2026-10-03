const mongoose = require('mongoose');
const { toLegacy } = require('../utils/legacy');
const { isObjectId } = require('../utils/ids');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['admin', 'member'], default: 'member' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

const User = mongoose.model('User', userSchema);
exports.Model = User;

exports.count = () => User.countDocuments();

// Includes the password hash - only for login.
exports.findByEmail = async (email) => toLegacy(await User.findOne({ email }).lean());

exports.emailExists = async (email) => !!(await User.exists({ email }));

exports.create = async ({ name, email, password, role }) => {
  const user = await User.create({ name, email, password, role });
  return String(user._id);
};

exports.findPublicById = async (id) => {
  if (!isObjectId(String(id))) return null;
  return toLegacy(await User.findById(id).select('name email role').lean());
};

exports.findPublicByEmail = async (email) =>
  toLegacy(await User.findOne({ email }).select('name email role').lean());

exports.findAll = async () => {
  const users = await User.find().select('name email role created_at').sort({ created_at: -1, _id: -1 }).lean();
  return users.map(toLegacy);
};

exports.updateRole = async (id, role) => {
  if (!isObjectId(String(id))) return null;
  const result = await User.updateOne({ _id: id }, { $set: { role } }, { runValidators: true });
  if (result.matchedCount === 0) return null;
  return exports.findPublicById(id);
};

// Map of userId(string) -> { name, email, role }. Replaces the SQL JOIN to users.
exports.mapByIds = async (ids) => {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (unique.length === 0) return new Map();
  const users = await User.find({ _id: { $in: unique } }).select('name email role').lean();
  return new Map(users.map((u) => [String(u._id), u]));
};
