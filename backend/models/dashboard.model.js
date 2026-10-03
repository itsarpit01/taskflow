// Read-only "report" model: combines tasks, projects and memberships.
const Task = require('./task.model');
const Project = require('./project.model');
const ProjectMember = require('./projectMember.model');

async function withProjectNames(tasks) {
  const names = await Project.mapNamesByIds(tasks.map((t) => t.project_id));
  return tasks.map((t) => ({ ...t, project_name: names.get(String(t.project_id)) ?? null }));
}

async function recentActivity(userId) {
  const memberships = await ProjectMember.listByUser(userId);
  const tasks = await Task.findRecentInProjects(memberships.map((m) => m.project_id), 8);
  return withProjectNames(tasks);
}

exports.forUser = async (user) => {
  const [myTasks, overdueTasks, myProjects, taskStats, recent] = await Promise.all([
    Task.findOpenAssigned(user.id, 10).then(withProjectNames),
    Task.findOverdueAssigned(user.id).then(withProjectNames),
    Project.listActiveForDashboard(user, 5),
    Task.statsForAssignee(user.id),
    recentActivity(user.id),
  ]);
  return { myTasks, overdueTasks, myProjects, taskStats, recentActivity: recent };
};
