import { useState } from 'react';
import { api } from '../api.js';
import { Alert, Badge, fmtDate, useFetch } from '../ui.jsx';

export default function Drives() {
  const [drives, err, reload] = useFetch(() => api('student/drives'));
  const [msg, setMsg] = useState({ type: 'success', text: '' });
  const apply = async (id) => {
    try { await api('student/apply', { method: 'POST', body: { drive_id: id } }); setMsg({ type: 'success', text: 'Applied successfully!' }); reload(); }
    catch (x) { setMsg({ type: 'danger', text: x.message }); }
  };
  return (
    <>
      <h4 className="mb-3">Placements &amp; Internships</h4>
      <Alert>{err}</Alert><Alert type={msg.type}>{msg.text}</Alert>
      <div className="row g-3">
        {drives?.map((d) => (
          <div className="col-md-6" key={d.id}><div className="card h-100"><div className="card-body">
            <div className="d-flex justify-content-between">
              <h6 className="mb-0">{d.title}</h6>
              <span className={'badge ' + (d.type === 'internship' ? 'text-bg-warning' : 'text-bg-primary')}>{d.type}</span>
            </div>
            <div className="text-muted small mb-2">{d.company} · {d.location}</div>
            <p className="small mb-2">{d.description}</p>
            <div className="small">
              <div><strong>{d.type === 'internship' ? 'Stipend' : 'Package'}:</strong> {d.package_lpa ? d.package_lpa + ' LPA' : '-'}</div>
              <div><strong>Criteria:</strong> CGPA ≥ {d.min_cgpa}, backlogs ≤ {d.max_backlogs}, {d.allowed_departments || 'all departments'}</div>
              <div><strong>Deadline:</strong> {fmtDate(d.deadline)}</div>
            </div>
            <div className="mt-3">
              {d.application_status ? <>Status: <Badge text={d.application_status} /></>
                : d.expired ? <span className="text-muted small">Deadline passed</span>
                : d.eligible ? <button className="btn btn-primary btn-sm" onClick={() => apply(d.id)}>Apply now</button>
                : <span className="badge text-bg-light border text-danger">Not eligible</span>}
            </div>
          </div></div></div>
        ))}
        {drives?.length === 0 && <div className="text-muted">No open drives right now.</div>}
      </div>
    </>
  );
}
