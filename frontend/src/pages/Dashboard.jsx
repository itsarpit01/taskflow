import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const priorityColors = { low: '#94a3b8', medium: '#6366f1', high: '#f59e0b', urgent: '#ef4444' };
const statusLabels = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

function StatCard({ label, value, color, icon }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem', flexShrink: 0
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1 }}>
          {value ?? 0}
        </div>
        <div style={{ color: 'var(--text2)', fontSize: '0.8rem', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

function TaskRow({ task }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  return (
    <Link to={`/projects/${task.project_id}`} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
      borderBottom: '1px solid var(--border)', textDecoration: 'none',
      transition: 'opacity var(--transition)'
    }}>
      <div style={{
        width: 4, height: 36, borderRadius: 2, flexShrink: 0,
        background: priorityColors[task.priority] || 'var(--border2)'
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.title}
        </div>
        <div style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 2 }}>
          {task.project_name}
          {task.due_date && (
            <span style={{ color: isOverdue ? 'var(--red)' : 'var(--text3)', marginLeft: 8 }}>
              {isOverdue ? '⚠ ' : ''}Due {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <span className={`badge badge-${task.status}`}>{statusLabels[task.status]}</span>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const { myTasks = [], overdueTasks = [], myProjects = [], taskStats = {} } = data || {};

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text2)' }}>Here's what's happening with your projects today.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="To Do" value={taskStats.todo} color="#94a3b8" icon="○" />
        <StatCard label="In Progress" value={taskStats.in_progress} color="#6366f1" icon="◔" />
        <StatCard label="In Review" value={taskStats.review} color="#f59e0b" icon="◑" />
        <StatCard label="Completed" value={taskStats.done} color="#10b981" icon="●" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* My Tasks */}
        <div>
          {overdueTasks.length > 0 && (
            <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--red)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚠ Overdue ({overdueTasks.length})
              </h3>
              {overdueTasks.slice(0, 3).map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          )}

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1rem' }}>My Active Tasks</h2>
              <Link to="/my-tasks" style={{ color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600 }}>View all →</Link>
            </div>
            {myTasks.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>✓</div>
                <h3>All caught up!</h3>
                <p style={{ fontSize: '0.82rem' }}>No active tasks assigned to you.</p>
              </div>
            ) : (
              myTasks.map(t => <TaskRow key={t.id} task={t} />)
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1rem' }}>My Projects</h2>
              <Link to="/projects" style={{ color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600 }}>All →</Link>
            </div>
            {myProjects.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p style={{ fontSize: '0.82rem' }}>No projects yet.</p>
              </div>
            ) : myProjects.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} style={{
                display: 'block', padding: '12px 0', borderBottom: '1px solid var(--border)',
                textDecoration: 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.name}</div>
                  <span style={{
                    background: 'rgba(99,102,241,0.1)', color: 'var(--accent)',
                    borderRadius: 20, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600
                  }}>{p.open_tasks} open</span>
                </div>
                <div style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 3 }}>by {p.owner_name}</div>
              </Link>
            ))}
            <Link to="/projects/new" className="btn btn-secondary btn-full" style={{ marginTop: 16, justifyContent: 'center' }}>
              + New Project
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
