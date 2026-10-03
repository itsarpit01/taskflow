const bcrypt = require('bcryptjs');
const User = require('./models/user.model');
const Project = require('./models/project.model');
const ProjectMember = require('./models/projectMember.model');
const Task = require('./models/task.model');

async function autoSeed() {
  if ((await User.count()) > 0) return;

  console.log('🌱 First boot: creating demo accounts...');
  const demoUsers = [
    { name: 'Aman', email: 'aman@gmail.com', password: 'password1234', role: 'admin' },
    { name: 'Sumit', email: 'sumit@gmail.com', password: 'password1234', role: 'member' },
    { name: 'Abhi', email: 'abhi@gmail.com', password: 'password1234', role: 'member' },
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
  const adminId = ids['aman@gmail.com'];
  const sumitId = ids['sumit@gmail.com'];
  const abhiId = ids['abhi@gmail.com'];

  // Project.create also adds the owner as project admin.
  const project = await Project.create({
    name: 'Sample Project',
    description: 'A demo project to explore TaskFlow features',
    ownerId: adminId,
  });
  await ProjectMember.upsert(project.id, sumitId, 'member');
  await ProjectMember.upsert(project.id, abhiId, 'member');

  const sampleTasks = [
    ['Design new landing page', 'in_progress', 'high', abhiId],
    ['Set up CI/CD pipeline', 'todo', 'urgent', adminId],
    ['Write documentation', 'todo', 'medium', sumitId],
    ['Fix login bug', 'review', 'high', abhiId],
    ['Deploy to production', 'done', 'urgent', adminId],
  ];
  for (const [title, status, priority, assigneeId] of sampleTasks) {
    await Task.create({ title, projectId: project.id, assigneeId, creatorId: adminId, status, priority });
  }

  console.log('✅ Demo data ready!');
  console.log('   Admin  → aman@gmail.com / password1234');
  console.log('   Member → sumit@gmail.com / password1234');
  console.log('   Member → abhi@gmail.com / password1234');
}

module.exports = { autoSeed };
