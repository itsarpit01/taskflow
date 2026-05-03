// seed.js - Run once to create demo accounts and sample data
const { getDb } = require('./db');
const bcrypt = require('bcryptjs');

const db = getDb();

console.log('🌱 Seeding demo data...');

// Demo users
const users = [
  { name: 'Admin User', email: 'admin@demo.com', password: 'demo1234', role: 'admin' },
  { name: 'Alice Johnson', email: 'alice@demo.com', password: 'demo1234', role: 'member' },
  { name: 'Bob Smith', email: 'bob@demo.com', password: 'demo1234', role: 'member' },
  { name: 'member@demo.com (Member)', email: 'member@demo.com', password: 'demo1234', role: 'member' },
];

const userIds = {};
for (const u of users) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(u.email);
  if (existing) { userIds[u.email] = existing.id; continue; }
  const hash = bcrypt.hashSync(u.password, 10);
  const r = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(u.name, u.email, hash, u.role);
  userIds[u.email] = r.lastInsertRowid;
  console.log(`  ✓ Created user: ${u.email}`);
}

// Sample projects
const projects = [
  { name: 'Website Redesign', description: 'Complete overhaul of the company website with new branding', owner: 'admin@demo.com' },
  { name: 'Mobile App MVP', description: 'Build the first version of our mobile application', owner: 'alice@demo.com' },
  { name: 'Marketing Campaign Q2', description: 'Plan and execute Q2 marketing initiatives', owner: 'admin@demo.com' },
];

for (const p of projects) {
  const existing = db.prepare('SELECT id FROM projects WHERE name = ?').get(p.name);
  if (existing) { console.log(`  - Project already exists: ${p.name}`); continue; }

  const ownerId = userIds[p.owner];
  const r = db.prepare('INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)').run(p.name, p.description, ownerId);
  const projectId = r.lastInsertRowid;

  // Add owner as admin
  db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(projectId, ownerId, 'admin');

  // Add other members
  for (const email of ['alice@demo.com', 'bob@demo.com', 'member@demo.com']) {
    if (userIds[email] !== ownerId) {
      db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(projectId, userIds[email], 'member');
    }
  }

  // Sample tasks
  const tasks = [
    { title: 'Set up project repository', status: 'done', priority: 'high', assignee: 'alice@demo.com' },
    { title: 'Design wireframes', status: 'done', priority: 'high', assignee: 'bob@demo.com' },
    { title: 'Implement authentication', status: 'in_progress', priority: 'urgent', assignee: 'alice@demo.com', due: '2025-02-01' },
    { title: 'Build dashboard UI', status: 'in_progress', priority: 'high', assignee: 'bob@demo.com', due: '2025-02-05' },
    { title: 'API integration', status: 'todo', priority: 'medium', assignee: 'member@demo.com' },
    { title: 'Write unit tests', status: 'todo', priority: 'medium', assignee: 'alice@demo.com' },
    { title: 'Performance optimization', status: 'review', priority: 'low', assignee: 'bob@demo.com' },
    { title: 'Deploy to staging', status: 'todo', priority: 'high', due: '2025-01-25' },
  ];

  for (const t of tasks) {
    db.prepare(`
      INSERT INTO tasks (title, project_id, assignee_id, creator_id, status, priority, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(t.title, projectId, t.assignee ? userIds[t.assignee] : null, ownerId, t.status, t.priority, t.due || null);
  }
  console.log(`  ✓ Created project: ${p.name} with ${tasks.length} tasks`);
}

console.log('\n✅ Seed complete!');
console.log('Demo accounts:');
console.log('  admin@demo.com / demo1234  (Admin)');
console.log('  member@demo.com / demo1234 (Member)');
console.log('  alice@demo.com / demo1234  (Member)');
