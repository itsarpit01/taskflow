const { getDb } = require('./db');
const bcrypt = require('bcryptjs');

async function autoSeed() {
  const db = await getDb();
  const count = await db.get('SELECT COUNT(*) as n FROM users');
  if (count.n > 0) return;

  console.log('🌱 First boot: creating demo accounts...');
  const users = [
    { name: 'Aman', email: 'aman@gmail.com', password: 'password1234', role: 'admin' },
    { name: 'Sumit', email: 'sumit@gmail.com', password: 'password1234', role: 'member' },
    { name: 'Abhi', email: 'abhi@gmail.com', password: 'password1234', role: 'member' },
  ];

  let adminId, sumitId, abhiId;

  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, 10);
    const r = await db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [u.name, u.email, hash, u.role]
    );
    if (u.email === 'aman@gmail.com') adminId = r.lastID;
    if (u.email === 'sumit@gmail.com') sumitId = r.lastID;
    if (u.email === 'abhi@gmail.com') abhiId = r.lastID;
  }

  const r = await db.run(
    'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
    ['Sample Project', 'A demo project to explore TaskFlow features', adminId]
  );
  const pid = r.lastID;

  await db.run('INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [pid, adminId, 'admin']);
  await db.run('INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [pid, sumitId, 'member']);
  await db.run('INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [pid, abhiId, 'member']);

  const sampleTasks = [
    ['Design new landing page', 'in_progress', 'high', abhiId],
    ['Set up CI/CD pipeline', 'todo', 'urgent', adminId],
    ['Write documentation', 'todo', 'medium', sumitId],
    ['Fix login bug', 'review', 'high', abhiId],
    ['Deploy to production', 'done', 'urgent', adminId],
  ];

  for (const [title, status, priority, assignee] of sampleTasks) {
    await db.run(
      'INSERT INTO tasks (title, project_id, assignee_id, creator_id, status, priority) VALUES (?, ?, ?, ?, ?, ?)',
      [title, pid, assignee, adminId, status, priority]
    );
  }

  console.log('✅ Demo data ready!');
  console.log('   Admin  → aman@gmail.com / password1234');
  console.log('   Member → sumit@gmail.com / password1234');
  console.log('   Member → abhi@gmail.com / password1234');
}

module.exports = { autoSeed };