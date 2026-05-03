import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_COLORS = { low: '#94a3b8', medium: '#6366f1', high: '#f59e0b', urgent: '#ef4444' };

export function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    // Fetch all projects then all tasks for user
    api.get('/projects').then(async ({ projects }) => {
      const all = [];
      for (const p of (projects || [])) {
        try {
          const d = await api.get(`/projects/${p.id}/tasks`);
          (d.tasks || []).forEach(t => { if (t.assignee_id) all.push({ ...t, project_name: p.name }); });
        } catch {}
      }
      setTasks(all);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter(t => {
    if (filter === 'active') return t.status !== 'done';
    if (filter === 'done') return t.status === 'done';
    if (filter === 'overdue') return t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';
    return true;
  });

  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done');

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>My Tasks</h1>
        <p style={{ color: 'var(--text2)' }}>{tasks.length} tasks assigned to you{overdue.length > 0 ? ` · ${overdue.length} overdue` : ''}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'active', label: 'Active' },
          { key: 'overdue', label: `Overdue (${overdue.length})` },
          { key: 'done', label: 'Completed' },
          { key: 'all', label: 'All' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ color: f.key === 'overdue' && filter !== f.key ? 'var(--red)' : undefined }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <div className="page-loader" style={{ minHeight: 200 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 48 }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>✓</div>
              <h3>No tasks here</h3>
            </div>
          ) : filtered.map(task => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
            return (
              <Link key={task.id} to={`/projects/${task.project_id}`} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                borderBottom: '1px solid var(--border)', textDecoration: 'none', transition: 'background var(--transition)'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{task.title}</div>
                  <div style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 2 }}>{task.project_name}</div>
                </div>
                <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                {task.due_date && (
                  <span style={{ fontSize: '0.78rem', color: isOverdue ? 'var(--red)' : 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {isOverdue ? '⚠ ' : ''}{new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users').then(d => setUsers(d.users || [])).finally(() => setLoading(false));
  }, []);

  const changeRole = async (userId, role) => {
    await api.put(`/users/${userId}/role`, { role });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>User Management</h1>
        <p style={{ color: 'var(--text2)' }}>{users.length} registered users</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)', fontSize: '0.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600 }}>User</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600 }}>Joined</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center' }}><div className="spinner" /></td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{u.name}</span>
                    {u.id === currentUser?.id && <span className="badge badge-admin" style={{ fontSize: '0.65rem' }}>You</span>}
                  </div>
                </td>
                <td style={{ padding: '14px 20px', color: 'var(--text2)', fontSize: '0.85rem' }}>{u.email}</td>
                <td style={{ padding: '14px 20px' }}><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                <td style={{ padding: '14px 20px', color: 'var(--text3)', fontSize: '0.82rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '14px 20px' }}>
                  {u.id !== currentUser?.id && (
                    <select style={{ width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
                      value={u.role} onChange={e => changeRole(u.id, e.target.value)}>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
