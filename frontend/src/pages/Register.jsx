import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Alert, Input, Select } from '../ui.jsx';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState('student');
  const [f, setF] = useState({ name: '', email: '', password: '', roll_no: '', department: 'CSE', year: 3, grad_year: 2024 });
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (role === 'student' && !f.email.trim().toLowerCase().endsWith('@rajalakshmi.edu.in')) {
      setErr('Student email must end with @rajalakshmi.edu.in');
      return;
    }
    try {
      await register({ ...f, role });
      nav(role === 'student' ? '/student' : '/alumni/profile');
    } catch (x) {
      setErr(x.message || 'Registration failed');
    }
  };

  const ch = (k, v) => setF({ ...f, [k]: v });

  return (
    <div className="auth-box">
      <div className="card auth-card p-4">
        <div className="text-center mb-3">
          <img src="/logo.png" alt="Rajalakshmi Engineering College Logo" className="rec-login-logo mb-2" />
          <h3 className="brand text-rec-purple mb-0">RAJALAKSHMI</h3>
          <div className="fw-bold text-dark small">ENGINEERING COLLEGE</div>
          <p className="text-muted small mt-1 mb-0 fw-medium">Create CareerBridge Account</p>
        </div>

        <form onSubmit={submit}>
          <Alert>{err}</Alert>
          <div className="mb-3">
            <label className="form-label small fw-semibold">I am registering as a:</label>
            <div className="d-flex gap-2">
              <button 
                type="button" 
                className={`btn btn-sm flex-fill ${role === 'student' ? 'btn-rec-primary' : 'btn-outline-secondary'}`} 
                onClick={() => setRole('student')}
              >
                Student
              </button>
              <button 
                type="button" 
                className={`btn btn-sm flex-fill ${role === 'alumni' ? 'btn-rec-primary' : 'btn-outline-secondary'}`} 
                onClick={() => setRole('alumni')}
              >
                Alumni
              </button>
            </div>
          </div>

          <Input label="Full Name" required value={f.name} onChange={(e) => ch('name', e.target.value)} />
          
          <Input 
            label="Email Address" 
            type="email" 
            required 
            placeholder={role === 'student' ? 'yourname@rajalakshmi.edu.in' : 'your.email@example.com'}
            value={f.email} 
            onChange={(e) => ch('email', e.target.value)} 
          />
          {role === 'student' ? (
            <small className="text-primary d-block mb-3" style={{ fontSize: '0.78rem', marginTop: '-8px' }}>
              🔒 Students must use official email ending with <strong>@rajalakshmi.edu.in</strong>
            </small>
          ) : (
            <small className="text-muted d-block mb-3" style={{ fontSize: '0.78rem', marginTop: '-8px' }}>
              🎓 Alumni can use their old college email or personal email address
            </small>
          )}

          <Input label="Password" type="password" required placeholder="Minimum 6 characters" value={f.password} onChange={(e) => ch('password', e.target.value)} />

          <Select label="Department" value={f.department} onChange={(e) => ch('department', e.target.value)}>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
          </Select>

          {role === 'student' ? (
            <div className="row g-2">
              <div className="col-6">
                <Input label="Roll No" value={f.roll_no} placeholder="e.g. 22CS109" onChange={(e) => ch('roll_no', e.target.value)} />
              </div>
              <div className="col-6">
                <Select label="Year of Study" value={f.year} onChange={(e) => ch('year', e.target.value)}>
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </Select>
              </div>
            </div>
          ) : (
            <Input label="Graduation Year" type="number" value={f.grad_year} onChange={(e) => ch('grad_year', e.target.value)} />
          )}

          <button className="btn btn-rec-primary w-100 py-2 fs-6 mt-3">Create Account</button>
        </form>

        <p className="small mt-3 mb-0 text-center">
          Already have an account? <Link to="/login" className="fw-semibold text-rec-purple">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
