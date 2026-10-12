import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Alert, DEPARTMENTS, Input, Select, Textarea } from '../ui.jsx';

export default function AlumniProfile() {
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState({ type: 'success', text: '' });
  useEffect(() => { api('alumni/profile').then(setF); }, []);
  if (!f) return null;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    try { await api('alumni/profile', { method: 'PUT', body: f }); setMsg({ type: 'success', text: 'Profile saved' }); }
    catch (x) { setMsg({ type: 'danger', text: x.message }); }
  };
  return (
    <div className="card p-4" style={{ maxWidth: 720 }}>
      <h4 className="mb-3">My Alumni Profile</h4>
      <form onSubmit={save}>
        <Alert type={msg.type}>{msg.text}</Alert>
        <Input label="Name" value={f.name || ''} onChange={set('name')} />
        <div className="row"><div className="col-md-6"><Select label="Department" value={f.department || 'CSE'} onChange={set('department')} options={DEPARTMENTS} /></div>
          <div className="col-md-6"><Input label="Graduation year" type="number" value={f.grad_year || ''} onChange={set('grad_year')} /></div></div>
        <div className="row"><div className="col-md-6"><Input label="Company" value={f.company || ''} onChange={set('company')} /></div>
          <div className="col-md-6"><Input label="Designation" value={f.designation || ''} onChange={set('designation')} /></div></div>
        <Input label="Skills (comma separated)" value={f.skills || ''} onChange={set('skills')} />
        <Textarea label="Short bio" value={f.bio || ''} onChange={set('bio')} />
        <div className="form-check mb-3">
          <input className="form-check-input" type="checkbox" id="m" checked={!!+f.open_to_mentor} onChange={(e) => setF({ ...f, open_to_mentor: e.target.checked ? 1 : 0 })} />
          <label className="form-check-label" htmlFor="m">I am open to mentoring students</label>
        </div>
        <button className="btn btn-primary">Save profile</button>
      </form>
    </div>
  );
}
