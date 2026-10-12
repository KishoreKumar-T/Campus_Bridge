import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Alert, Input } from '../ui.jsx';

const HOME = { student: '/student', alumni: '/alumni/profile', admin: '/admin' };

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async (email, password) => {
    setErr('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res && res.user && res.user.role) {
        nav(HOME[res.user.role] || '/');
      }
    } catch (x) {
      setErr(x.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    await doLogin(f.email, f.password);
  };

  const demoLogin = async (email) => {
    setF({ email, password: 'password123' });
    await doLogin(email, 'password123');
  };

  return (
    <div className="auth-box">
      <div className="card auth-card p-4">
        <div className="text-center mb-3">
          <img src="/logo_r.png" alt="Rajalakshmi Engineering College Logo" className="rec-login-logo mb-2" style={{ maxHeight: '110px' }} />
          <h3 className="brand text-rec-purple mb-0">RAJALAKSHMI</h3>
          <div className="fw-bold text-dark small">ENGINEERING COLLEGE</div>
          <p className="text-muted small mt-1 mb-0 fw-medium">CareerBridge Placement &amp; Alumni Network</p>
        </div>

        <form onSubmit={submit}>
          <Alert>{err}</Alert>
          <Input 
            label="Email Address" 
            type="email" 
            required 
            placeholder="e.g. arun.k@rajalakshmi.edu.in"
            value={f.email} 
            onChange={(e) => setF({ ...f, email: e.target.value })} 
          />
          <small className="text-muted d-block mb-3" style={{ fontSize: '0.78rem', marginTop: '-8px' }}>
            ℹ️ Admin &amp; Students must use email ending with <strong>@rajalakshmi.edu.in</strong>
          </small>

          <Input 
            label="Password" 
            type="password" 
            required 
            placeholder="••••••••"
            value={f.password} 
            onChange={(e) => setF({ ...f, password: e.target.value })} 
          />
          <button className="btn btn-rec-primary w-100 py-2 fs-6 mt-2" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In to Portal'}
          </button>
        </form>

        <p className="small mt-3 mb-2 text-center">
          New student/alumni? <Link to="/register" className="fw-semibold text-rec-purple">Create an account</Link>
        </p>

        <div className="bg-light p-3 rounded-3 mt-3 border border-light-subtle">
          <p className="small text-muted mb-2 fw-semibold text-center">⚡ One-Click Demo Logins (Password: <code className="text-dark">password123</code>)</p>
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <button className="btn btn-sm btn-outline-rec" onClick={() => demoLogin('admin@rajalakshmi.edu.in')} disabled={loading}>
              Placement Admin
            </button>
            <button className="btn btn-sm btn-outline-rec" onClick={() => demoLogin('arun.k@rajalakshmi.edu.in')} disabled={loading}>
              Student (CSE)
            </button>
            <button className="btn btn-sm btn-outline-rec" onClick={() => demoLogin('priya.nair@alumni.rajalakshmi.edu.in')} disabled={loading}>
              Alumni (Zoho)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
