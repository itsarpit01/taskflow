const mongoose = require('mongoose');
const { toLegacy } = require('../utils/legacy');
const { isObjectId } = require('../utils/ids');
const User = require('./user.model');

const { ObjectId } = mongoose.Schema.Types;

const commentSchema = new mongoose.Schema({
  task_id: { type: ObjectId, ref: 'Task', required: true, index: true },
  user_id: { type: ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

const Comment = mongoose.model('Comment', commentSchema, 'task_comments');
exports.Model = Comment;

async function withUserNames(comments) {
  const users = await User.mapByIds(comments.map((c) => c.user_id));
  return comments.map((c) => ({ ...toLegacy(c), user_name: users.get(String(c.user_id))?.name ?? null }));
}

exports.findByTask = async (taskId) => {
  if (!isObjectId(String(taskId))) return [];
  const comments = await Comment.find({ task_id: taskId }).sort({ created_at: 1, _id: 1 }).lean();
  return withUserNames(comments);
};

exports.create = async ({ taskId, userId, content }) => {
  const doc = await Comment.create({ task_id: taskId, user_id: userId, content });
  const [comment] = await withUserNames([doc.toObject()]);
  return comment;
};
