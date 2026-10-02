const { getDb } = require('../db');

const COMMENT_SELECT = `
  SELECT tc.*, u.name AS user_name
  FROM task_comments tc
  JOIN users u ON tc.user_id = u.id`;

exports.findByTask = async (taskId) => {
  const db = await getDb();
  return db.all(`${COMMENT_SELECT} WHERE tc.task_id = ? ORDER BY tc.created_at ASC`, taskId);
};

exports.findById = async (commentId) => {
  const db = await getDb();
  return db.get(`${COMMENT_SELECT} WHERE tc.id = ?`, commentId);
};

exports.create = async ({ taskId, userId, content }) => {
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO task_comments (task_id, user_id, content) VALUES (?, ?, ?)',
    taskId, userId, content
  );
  return exports.findById(result.lastID);
};
