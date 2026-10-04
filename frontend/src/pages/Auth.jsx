import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function EyeIcon({ off }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {off ? (
        <>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

// Password field with a show / hide (eye) button
function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input {...props} type={show ? 'text' : 'password'} style={{ paddingRight: 44 }} />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          background: 'transparent', color: 'var(--text2)', padding: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6
        }}
      >
        <EyeIcon off={show} />
      </button>
    </div>
  );
}

function AuthLayout({ children, title, subtitle }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(6,78,59,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(184,137,43,0.06) 0%, transparent 60%)',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 190, height: 74, borderRadius: 999, margin: '0 auto 24px',
            backgroundImage: 'url(/logo.jpeg)',
            backgroundSize: '251px auto', backgroundPosition: '-33px -86px',
            backgroundRepeat: 'no-repeat'
          }} role="img" aria-label="TaskFlow" />
          <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>{title}</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>{subtitle}</p>
        </div>
        <div className="card auth-card" style={{ padding: 28 }}>
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
          <PasswordInput placeholder="••••••••" required
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
          <PasswordInput placeholder="Min 6 characters" required minLength={6}
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