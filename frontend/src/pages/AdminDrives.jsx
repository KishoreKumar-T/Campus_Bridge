import { useState } from 'react';
import { api, FILE_HOST } from '../api.js';
import { Alert, Badge, DEPARTMENTS, Input, Select, Textarea, fmt, fmtDate, useFetch } from '../ui.jsx';

const EMPTY = { company_id: '', title: '', type: 'placement', description: '', package_lpa: '', location: '', deadline: '', min_cgpa: 7, max_backlogs: 0, allowed_departments: '' };

export default function AdminDrives() {
  const [drives, err, reload] = useFetch(() => api('admin/drives'));
  const [companies] = useFetch(() => api('admin/companies'));
  const [f, setF] = useState(EMPTY);
  const [msg, setMsg] = useState({ type: 'success', text: '' });
  const [sel, setSel] = useState(null);          // drive whose applicants / eligible list is open
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    try {
      const body = { ...f, deadline: f.deadline.replace('T', ' ') };
      const r = await api('admin/drives' + (f.id ? '/' + f.id : ''), { method: f.id ? 'PUT' : 'POST', body });
      setMsg({ type: 'success', text: f.id ? 'Drive updated' : `Drive published. ${r.notified} eligible students were notified automatically.` });
      setF(EMPTY); reload();
    } catch (x) { setMsg({ type: 'danger', text: x.message }); }
  };
  const edit = (d) => setF({ ...d, deadline: d.deadline.replace(' ', 'T').slice(0, 16), package_lpa: d.package_lpa ?? '' });
  const del = async (id) => { if (confirm('Delete this drive?')) { await api('admin/drives/' + id, { method: 'DELETE' }); setSel(null); reload(); } };
  const toggle = async (d) => { await api('admin/drives/' + d.id, { method: 'PUT', body: { ...d, status: d.status === 'open' ? 'closed' : 'open' } }); reload(); };

  return (
    <>
      <h4 className="mb-3">Recruitment Drives &amp; Internships</h4>
      <Alert>{err}</Alert><Alert type={msg.type}>{msg.text}</Alert>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="table-responsive card"><table className="table mb-0 align-middle">
            <thead><tr><th>Drive</th><th>Criteria</th><th>Deadline</th><th>Applicants</th><th>Status</th><th /></tr></thead>
            <tbody>{drives?.map((d) => (
              <tr key={d.id} className={sel?.id === d.id ? 'table-active' : ''}>
                <td>{d.title}<div className="small text-muted">{d.company} · {d.type}</div></td>
                <td className="small">CGPA ≥ {d.min_cgpa}<br />Backlogs ≤ {d.max_backlogs}<br />{d.allowed_departments || 'All depts'}</td>
                <td className="small">{fmtDate(d.deadline)}</td><td>{d.applicants}</td><td><Badge text={d.status} /></td>
                <td className="text-end text-nowrap">
                  <button className="btn btn-sm btn-primary me-1" onClick={() => setSel(d)}>Manage</button>
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => edit(d)}>Edit</button>
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => toggle(d)}>{d.status === 'open' ? 'Close' : 'Reopen'}</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => del(d.id)}>×</button>
                </td></tr>))}</tbody>
          </table></div>
          {sel && <Manage key={sel.id} drive={sel} onClose={() => setSel(null)} onChange={reload} />}
        </div>

        <div className="col-lg-4"><div className="card p-3">
          <h6>{f.id ? 'Edit drive' : 'Publish new drive'}</h6>
          <form onSubmit={save}>
            {!f.id && <Select label="Company" required value={f.company_id} onChange={set('company_id')} options={[['', '-- select --'], ...(companies || []).map((c) => [c.id, c.name])]} />}
            <Input label="Role / title" required value={f.title} onChange={set('title')} />
            {!f.id && <Select label="Type" value={f.type} onChange={set('type')} options={['placement', 'internship']} />}
            <Textarea label="Description" value={f.description || ''} onChange={set('description')} />
            <div className="row">
              <div className="col-6"><Input label="Package / stipend (LPA)" type="number" step="0.01" value={f.package_lpa} onChange={set('package_lpa')} /></div>
              <div className="col-6"><Input label="Location" value={f.location || ''} onChange={set('location')} /></div>
              <div className="col-6"><Input label="Min CGPA" type="number" step="0.1" value={f.min_cgpa} onChange={set('min_cgpa')} /></div>
              <div className="col-6"><Input label="Max backlogs" type="number" min="0" value={f.max_backlogs} onChange={set('max_backlogs')} /></div>
            </div>
            <Input label={`Allowed departments (e.g. ${DEPARTMENTS.slice(0, 2).join(',')}; blank = all)`} value={f.allowed_departments || ''} onChange={set('allowed_departments')} />
            <Input label="Application deadline" type="datetime-local" required value={f.deadline} onChange={set('deadline')} />
            <button className="btn btn-primary btn-sm me-2">{f.id ? 'Update' : 'Publish'}</button>
            {f.id && <button type="button" className="btn btn-sm btn-light" onClick={() => setF(EMPTY)}>Cancel</button>}
          </form>
        </div></div>
      </div>
    </>
  );
}

// Applicants of one drive: shortlist, schedule interview, select/reject, export for the company
function Manage({ drive, onClose, onChange }) {
  const [apps, err, reload] = useFetch(() => api(`admin/drives/${drive.id}/applicants`));
  const [elig, setElig] = useState(null);
  const [iv, setIv] = useState(null);           // application being scheduled
  const [ivForm, setIvForm] = useState({ scheduled_at: '', mode: 'offline', location: '' });

  const setStatus = async (id, status) => { await api('admin/applications/' + id, { method: 'PUT', body: { status } }); reload(); onChange(); };
  const schedule = async (e) => {
    e.preventDefault();
    await api(`admin/applications/${iv}/interview`, { method: 'POST', body: { ...ivForm, scheduled_at: ivForm.scheduled_at.replace('T', ' ') } });
    setIv(null); reload();
  };
  const download = async () => {            // fetch with the auth header, then save as a file
    const res = await api(`admin/drives/${drive.id}/shortlist`, { raw: true });
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a'); a.href = url; a.download = `shortlist_${drive.company}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="card p-3 mt-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">{drive.title} – {drive.company}</h6>
        <div>
          <button className="btn btn-sm btn-outline-primary me-1" onClick={async () => setElig(await api(`admin/drives/${drive.id}/eligible`))}>Show eligible students</button>
          <button className="btn btn-sm btn-outline-success me-1" onClick={download}>Export shortlist (CSV)</button>
          <button className="btn-close" onClick={onClose} />
        </div>
      </div>
      <Alert>{err}</Alert>
      {elig && <div className="alert alert-info py-2 small"><strong>{elig.length} eligible:</strong> {elig.map((s) => `${s.name} (${s.department}, ${s.cgpa})`).join('; ') || 'none'}</div>}
      <div className="table-responsive"><table className="table table-sm align-middle mb-0">
        <thead><tr><th>Student</th><th>Dept</th><th>CGPA</th><th>Resume</th><th>Status</th><th>Interview</th><th>Actions</th></tr></thead>
        <tbody>{apps?.map((a) => (
          <tr key={a.id}>
            <td>{a.name}<div className="small text-muted">{a.email}</div></td><td>{a.department}</td><td>{a.cgpa}</td>
            <td>{a.resume_file ? <a href={`${FILE_HOST}/careerbridge/backend/uploads/resumes/${a.resume_file}`} target="_blank" rel="noreferrer">PDF</a> : '-'}</td>
            <td><Badge text={a.status} /></td><td className="small">{a.scheduled_at ? fmt(a.scheduled_at) : '-'}</td>
            <td className="text-nowrap">
              <button className="btn btn-sm btn-outline-info me-1" onClick={() => setStatus(a.id, 'shortlisted')}>Shortlist</button>
              <button className="btn btn-sm btn-outline-warning me-1" onClick={() => setIv(a.id)}>Interview</button>
              <button className="btn btn-sm btn-outline-success me-1" onClick={() => setStatus(a.id, 'selected')}>Select</button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => setStatus(a.id, 'rejected')}>Reject</button>
            </td></tr>))}
          {apps?.length === 0 && <tr><td colSpan="7" className="text-muted">No applications yet.</td></tr>}</tbody>
      </table></div>
      {iv && (
        <form className="row g-2 mt-2 align-items-end" onSubmit={schedule}>
          <div className="col-md-4"><label className="small fw-semibold">Date &amp; time</label><input className="form-control" type="datetime-local" required value={ivForm.scheduled_at} onChange={(e) => setIvForm({ ...ivForm, scheduled_at: e.target.value })} /></div>
          <div className="col-md-2"><label className="small fw-semibold">Mode</label><select className="form-select" value={ivForm.mode} onChange={(e) => setIvForm({ ...ivForm, mode: e.target.value })}><option>offline</option><option>online</option></select></div>
          <div className="col-md-4"><label className="small fw-semibold">Venue / link</label><input className="form-control" value={ivForm.location} onChange={(e) => setIvForm({ ...ivForm, location: e.target.value })} /></div>
          <div className="col-md-2"><button className="btn btn-primary w-100">Schedule</button></div>
        </form>
      )}
    </div>
  );
}
