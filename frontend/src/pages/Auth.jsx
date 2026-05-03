import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthLayout({ children, title, subtitle }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(34,211,238,0.05) 0%, transparent 60%)',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24,
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem'
          }}>
            <div style={{
              width: 38, height: 38, background: 'var(--accent)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', boxShadow: '0 4px 16px var(--accent-glow)'
            }}>⚡</div>
            TaskFlow
          </div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>{title}</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>{subtitle}</p>
        </div>
        <div className="card" style={{ padding: 28 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your TaskFlow account">
      <form onSubmit={handle}>
        <div className="form-group">
          <label className="label">Email</label>
          <input type="email" placeholder="you@company.com" required
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="label">Password</label>
          <input type="password" placeholder="••••••••" required
            value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
        </div>
        {error && <div className="error-msg">{error}</div>}
        <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 20 }} disabled={loading}>
          {loading ? <span className="spinner" style={{width:16,height:16}} /> : null}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text2)', fontSize: '0.875rem' }}>
        No account? <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create one</Link>
      </p>
      <div className="divider" />
      <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '0.78rem' }}>
        Demo: admin@demo.com / demo1234 · member@demo.com / demo1234
      </p>
    </AuthLayout>
  );
}

export function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Start managing your team's tasks">
      <form onSubmit={handle}>
        <div className="form-group">
          <label className="label">Full Name</label>
          <input type="text" placeholder="Jane Smith" required
            value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="label">Email</label>
          <input type="email" placeholder="you@company.com" required
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="label">Password</label>
          <input type="password" placeholder="Min 6 characters" required minLength={6}
            value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="label">Role</label>
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }} disabled={loading}>
          {loading ? <span className="spinner" style={{width:16,height:16}} /> : null}
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text2)', fontSize: '0.875rem' }}>
        Have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
      </p>
    </AuthLayout>
  );
}
