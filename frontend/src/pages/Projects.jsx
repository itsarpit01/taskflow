import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function ProjectCard({ project }) {
  const progress = project.task_count > 0
    ? Math.round(((project.task_count - (project.open_tasks || 0)) / project.task_count) * 100)
    : 0;

  return (
    <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{
        transition: 'all var(--transition)', cursor: 'pointer',
        borderColor: 'var(--border)',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{project.name}</h3>
          <span className={`badge badge-${project.status}`}>{project.status}</span>
        </div>
        {project.description && (
          <p style={{ color: 'var(--text2)', fontSize: '0.82rem', marginBottom: 16, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, fontSize: '0.8rem', color: 'var(--text2)' }}>
          <span>👤 {project.member_count} members</span>
          <span>◉ {project.task_count} tasks</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: '0.75rem' }}>by {project.owner_name}</span>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 6 }}>
            <span>Progress</span><span>{progress}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function NewProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await api.post('/projects', form);
      onCreated(data.project);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 480, padding: 28 }}>
        <h2 style={{ marginBottom: 20, fontSize: '1.2rem' }}>Create New Project</h2>
        <form onSubmit={handle}>
          <div className="form-group">
            <label className="label">Project Name</label>
            <input type="text" required placeholder="e.g. Website Redesign" autoFocus
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="label">Description (optional)</label>
            <textarea rows={3} placeholder="What is this project about?"
              value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              style={{ resize: 'vertical' }} />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects').then(d => setProjects(d.projects || [])).finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p => filter === 'all' || p.status === filter);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Projects</h1>
          <p style={{ color: 'var(--text2)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['all', 'active', 'archived'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loader" style={{ minHeight: 200 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>◉</div>
          <h3>No projects yet</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: 20 }}>Create your first project to get started</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={(p) => { setProjects(prev => [p, ...prev]); setShowModal(false); navigate(`/projects/${p.id}`); }}
        />
      )}
    </div>
  );
}
