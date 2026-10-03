const bcrypt = require('bcryptjs');
const User = require('./models/user.model');
const Project = require('./models/project.model');
const ProjectMember = require('./models/projectMember.model');
const Task = require('./models/task.model');

async function autoSeed() {
  // Run only if the demo admin doesn't exist yet (works even if other users already exist)
  if (await User.findByEmail('admin@demo.com')) return;

  console.log(' First boot: creating demo accounts...');
  const demoUsers = [
    { name: 'Admin', email: 'admin@demo.com', password: 'demo1234', role: 'admin' },
    { name: 'Member', email: 'member@demo.com', password: 'demo1234', role: 'member' },
  ];

  const ids = {};
  for (const u of demoUsers) {
    ids[u.email] = await User.create({
      name: u.name,
      email: u.email,
      password: await bcrypt.hash(u.password, 10),
      role: u.role,
    });
  }
  const adminId = ids['admin@demo.com'];
  const memberId = ids['member@demo.com'];

  const project = await Project.create({
    name: 'Sample Project',
    description: 'A demo project to explore TaskFlow features',
    ownerId: adminId,
  });
  await ProjectMember.upsert(project.id, memberId, 'member');

  const sampleTasks = [
    ['Design new landing page', 'in_progress', 'high', memberId],
    ['Set up CI/CD pipeline', 'todo', 'urgent', adminId],
    ['Write documentation', 'todo', 'medium', memberId],
    ['Fix login bug', 'review', 'high', memberId],
    ['Deploy to production', 'done', 'urgent', adminId],
  ];
  for (const [title, status, priority, assigneeId] of sampleTasks) {
    await Task.create({ title, projectId: project.id, assigneeId, creatorId: adminId, status, priority });
  }

  console.log('✅ Demo data ready!');
  console.log('   Admin  → admin@demo.com / demo1234');
  console.log('   Member → member@demo.com / demo1234');
}

module.exports = { autoSeed };