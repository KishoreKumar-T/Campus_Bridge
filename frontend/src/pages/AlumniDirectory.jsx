import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, DEPARTMENTS, useFetch } from '../ui.jsx';

export default function AlumniDirectory() {
  const { user } = useAuth();
  const [flt, setFlt] = useState({ department: '', grad_year: '', skill: '', company: '' });
  const [list, err, reload] = useFetch(() => api('alumni?' + new URLSearchParams(Object.entries(flt).filter(([, v]) => v))), []);
  const [note, setNote] = useState('');

  const request = async (alumni_id, type) => {
    const message = type === 'mentorship' ? prompt('Tell the alumni what guidance you need:') : '';
    if (type === 'mentorship' && message === null) return;
    try { await api('connections', { method: 'POST', body: { alumni_id, type, message } }); setNote('Request sent!'); }
    catch (x) { setNote(x.message); }
  };
  const set = (k) => (e) => setFlt({ ...flt, [k]: e.target.value });

  return (
    <>
      <h4 className="mb-3">Alumni Network</h4>
      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-3"><select className="form-select" value={flt.department} onChange={set('department')}><option value="">All departments</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div className="col-md-2"><input className="form-control" placeholder="Grad year" value={flt.grad_year} onChange={set('grad_year')} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Skill" value={flt.skill} onChange={set('skill')} /></div>
          <div className="col-md-2"><input className="form-control" placeholder="Company" value={flt.company} onChange={set('company')} /></div>
          <div className="col-md-2"><button className="btn btn-primary w-100" onClick={reload}>Search</button></div>
        </div>
      </div>
      <Alert>{err}</Alert>
      <Alert type="info">{note}</Alert>
      <div className="row g-3">
        {list?.map((a) => (
          <div className="col-md-6 col-lg-4" key={a.id}><div className="card h-100"><div className="card-body">
            <h6 className="mb-0">{a.name}</h6>
            <div className="small text-muted mb-2">{a.designation} {a.company && `@ ${a.company}`}</div>
            <div className="small">{a.department} · Batch {a.grad_year}</div>
            <div className="small mb-2"><strong>Skills:</strong> {a.skills || '-'}</div>
            <p className="small text-muted">{a.bio}</p>
            {user.role === 'student' && (
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-primary" onClick={() => request(a.id, 'connect')}>Connect</button>
                {+a.open_to_mentor ? <button className="btn btn-sm btn-primary" onClick={() => request(a.id, 'mentorship')}>Request mentorship</button> : <span className="small text-muted align-self-center">Not mentoring</span>}
              </div>
            )}
          </div></div></div>
        ))}
        {list?.length === 0 && <div className="text-muted">No alumni match your search.</div>}
      </div>
    </>
  );
}
