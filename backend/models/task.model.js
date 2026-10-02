const { getDb } = require('../db');

// The same SELECT + JOINs were copy-pasted 3 times in the old route file.
// Now it lives in exactly one place.
const TASK_SELECT = `
  SELECT t.*, u_assign.name AS assignee_name, u_assign.email AS assignee_email,
         u_creator.name AS creator_name
  FROM tasks t
  LEFT JOIN users u_assign  ON t.assignee_id = u_assign.id
  LEFT JOIN users u_creator ON t.creator_id  = u_creator.id`;

// Whitelist: column names are put into the SQL string, so they must never
// come straight from the request.
const UPDATABLE_FIELDS = ['title', 'description', 'assignee_id', 'status', 'priority', 'due_date'];

exports.findByProject = async (projectId, { status, priority, assignee_id } = {}) => {
  const db = await getDb();
  let query = `${TASK_SELECT} WHERE t.project_id = ?`;
  const params = [projectId];
  if (status)      { query += ' AND t.status = ?';      params.push(status); }
  if (priority)    { query += ' AND t.priority = ?';    params.push(priority); }
  if (assignee_id) { query += ' AND t.assignee_id = ?'; params.push(assignee_id); }
  query += ' ORDER BY t.created_at DESC';
  return db.all(query, ...params);
};

exports.findById = async (taskId) => {
  const db = await getDb();
  return db.get(`${TASK_SELECT} WHERE t.id = ?`, taskId);
};

exports.findInProject = async (taskId, projectId) => {
  const db = await getDb();
  return db.get('SELECT * FROM tasks WHERE id = ? AND project_id = ?', taskId, projectId);
};

exports.create = async ({ title, description, projectId, assigneeId, creatorId, priority, dueDate }) => {
  const db = await getDb();
  const result = await db.run(
    `INSERT INTO tasks (title, description, project_id, assignee_id, creator_id, priority, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    title, description || null, projectId, assigneeId || null, creatorId, priority, dueDate || null
  );
  return exports.findById(result.lastID);
};

// Returns false when there was nothing valid to update.
exports.update = async (taskId, data) => {
  const updates = [];
  const params = [];
  for (const field of UPDATABLE_FIELDS) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(data[field] === '' ? null : data[field]);
    }
  }
  if (updates.length === 0) return false;
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(taskId);
  const db = await getDb();
  await db.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, ...params);
  return true;
};

exports.remove = async (taskId) => {
  const db = await getDb();
  await db.run('DELETE FROM tasks WHERE id = ?', taskId);
};
