import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_COLORS = { low: '#94a3b8', medium: '#6366f1', high: '#f59e0b', urgent: '#ef4444' };

function TaskModal({ task, members, projectId, onClose, onSaved, onDeleted }) {
  const { user } = useAuth();
  const [form, setForm] = useState(task ? {
    title: task.title, description: task.description || '', status: task.status,
    priority: task.priority, assignee_id: task.assignee_id || '', due_date: task.due_date || ''
  } : { title: '', description: '', status: 'todo', priority: 'medium', assignee_id: '', due_date: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (task) {
      api.get(`/projects/${projectId}/tasks/${task.id}/comments`).then(d => setComments(d.comments || []));
    }
  }, [task]);

  const save = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const payload = { ...form, assignee_id: form.assignee_id || null, due_date: form.due_date || null };
      const data = task
        ? await api.put(`/projects/${projectId}/tasks/${task.id}`, payload)
        : await api.post(`/projects/${projectId}/tasks`, payload);
      onSaved(data.task);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const deleteTask = async () => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/projects/${projectId}/tasks/${task.id}`);
    onDeleted(task.id);
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const data = await api.post(`/projects/${projectId}/tasks/${task.id}/comments`, { content: comment });
    setComments(prev => [...prev, data.comment]);
    setComment('');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex',
      alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '40px 20px', overflowY: 'auto'
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 600, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.1rem' }}>{task ? 'Edit Task' : 'Create Task'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={save}>
          <div className="form-group">
            <label className="label">Title</label>
            <input type="text" required autoFocus placeholder="Task title..."
              value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea rows={3} placeholder="Describe this task..."
              value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              style={{ resize: 'vertical' }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                {PRIORITIES.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Assignee</label>
              <select value={form.assignee_id} onChange={e => setForm({...form, assignee_id: e.target.value})}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
            </div>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {task && <button type="button" className="btn btn-danger btn-sm" onClick={deleteTask}>Delete</button>}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>

        {task && (
          <>
            <hr className="divider" />
            <h3 style={{ fontSize: '0.85rem', marginBottom: 12, color: 'var(--text2)' }}>Comments ({comments.length})</h3>
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
              {comments.map(c => (
                <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 700, flexShrink: 0
                    }}>{c.user_name?.[0]?.toUpperCase()}</div>
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{c.user_name}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text3)', marginLeft: 8 }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text2)', marginLeft: 32 }}>{c.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={addComment} style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary btn-sm">Post</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onClick }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  return (
    <div className="card" style={{ padding: '14px', marginBottom: 10, cursor: 'pointer', transition: 'all var(--transition)' }}
      onClick={() => onClick(task)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4, flex: 1 }}>{task.title}</p>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0, marginTop: 4 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text3)' }}>
        <span>{task.assignee_name ? `👤 ${task.assignee_name}` : 'Unassigned'}</span>
        {task.due_date && (
          <span style={{ color: isOverdue ? 'var(--red)' : 'var(--text3)' }}>
            {isOverdue ? '⚠ ' : ''}{new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await api.post(`/projects/${projectId}/members`, { email, role });
      onAdded();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 400, padding: 28 }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: 20 }}>Add Team Member</h2>
        <form onSubmit={handle}>
          <div className="form-group">
            <label className="label">Email</label>
            <input type="email" required autoFocus placeholder="member@company.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>Add Member</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null); // null | 'new' | task obj
  const [showAddMember, setShowAddMember] = useState(false);
  const [view, setView] = useState('kanban');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const load = async () => {
    try {
      const [projData, taskData] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`)
      ]);
      setProject(projData.project);
      setMembers(projData.members || []);
      setStats(projData.stats || {});
      setTasks(taskData.tasks || []);
    } catch (err) {
      if (err.message.includes('not found') || err.message.includes('denied')) navigate('/projects');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [projectId]);

  const myMembership = members.find(m => m.id === user?.id);
  const isProjectAdmin = user?.role === 'admin' || myMembership?.project_role === 'admin';

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = filteredTasks.filter(t => t.status === s);
    return acc;
  }, {});

  const onTaskSaved = (saved) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
    setTaskModal(null);
    load(); // refresh stats
  };

  const onTaskDeleted = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setTaskModal(null);
  };

  const removeMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    await api.delete(`/projects/${projectId}/members/${memberId}`);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!project) return null;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'var(--text3)', fontSize: '0.8rem', marginBottom: 6 }}>
              <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => navigate('/projects')}>Projects</span> / {project.name}
            </div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>{project.name}</h1>
            {project.description && <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {isProjectAdmin && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}>+ Member</button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setTaskModal('new')}>+ Task</button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: stats.total || 0, color: 'var(--text2)' },
            { label: 'To Do', value: stats.todo || 0, color: '#94a3b8' },
            { label: 'In Progress', value: stats.in_progress || 0, color: 'var(--accent)' },
            { label: 'Review', value: stats.review || 0, color: 'var(--yellow)' },
            { label: 'Done', value: stats.done || 0, color: 'var(--green)' },
            { label: 'Overdue', value: stats.overdue || 0, color: 'var(--red)' },
          ].map(s => (
            <div key={s.label} style={{ padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters + View toggle */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
          value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {['kanban', 'list'].map(v => (
            <button key={v} className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView(v)} style={{ textTransform: 'capitalize' }}>{v}</button>
          ))}
        </div>
      </div>

      {/* KANBAN VIEW */}
      {view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {STATUSES.map(status => (
            <div key={status}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text2)' }}>
                    {STATUS_LABELS[status]}
                  </span>
                  <span style={{ background: 'var(--bg3)', borderRadius: 10, padding: '1px 7px', fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600 }}>
                    {tasksByStatus[status].length}
                  </span>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={() => setTaskModal('new')}>+</button>
              </div>
              <div style={{ minHeight: 80 }}>
                {tasksByStatus[status].map(task => (
                  <TaskCard key={task.id} task={task} onClick={() => setTaskModal(task)} />
                ))}
                {tasksByStatus[status].length === 0 && (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text3)', fontSize: '0.78rem', border: '1px dashed var(--border)', borderRadius: 8 }}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', fontSize: '0.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Task</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Priority</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Assignee</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>No tasks found</td></tr>
              ) : filteredTasks.map(task => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                return (
                  <tr key={task.id} onClick={() => setTaskModal(task)} style={{ cursor: 'pointer', borderTop: '1px solid var(--border)', transition: 'background var(--transition)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
                        {task.title}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}><span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span></td>
                    <td style={{ padding: '12px 16px' }}><span className={`badge badge-${task.priority}`} style={{ textTransform: 'capitalize' }}>{task.priority}</span></td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text2)' }}>{task.assignee_name || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: isOverdue ? 'var(--red)' : 'var(--text2)' }}>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Members section */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>Team Members ({members.length})</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                {m.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '0.83rem', fontWeight: 600 }}>{m.name}</div>
                <span className={`badge badge-${m.project_role}`} style={{ padding: '1px 6px', fontSize: '0.65rem' }}>{m.project_role}</span>
              </div>
              {isProjectAdmin && m.id !== user?.id && (
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', padding: '2px 6px' }} onClick={() => removeMember(m.id)}>✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {taskModal !== null && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          members={members}
          projectId={projectId}
          onClose={() => setTaskModal(null)}
          onSaved={onTaskSaved}
          onDeleted={onTaskDeleted}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowAddMember(false)}
          onAdded={() => { setShowAddMember(false); load(); }}
        />
      )}
    </div>
  );
}
