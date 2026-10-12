import { useState } from 'react';
import { api, FILE_HOST } from '../api.js';
import { Alert, DEPARTMENTS, useFetch } from '../ui.jsx';

export default function AdminStudents() {
  const [q, setQ] = useState({ q: '', department: '' });
  const [list, err, reload] = useFetch(() => api('admin/students?' + new URLSearchParams(Object.entries(q).filter(([, v]) => v))));
  const [detail, setDetail] = useState(null);
  const remove = async (id) => { if (confirm('Delete this student and all their data?')) { await api('admin/users/' + id, { method: 'DELETE' }); setDetail(null); reload(); } };
  return (
    <>
      <h4 className="mb-3">Student Profiles</h4>
      <div className="card p-3 mb-3"><div className="row g-2">
        <div className="col-md-5"><input className="form-control" placeholder="Search name, roll no, skill" value={q.q} onChange={(e) => setQ({ ...q, q: e.target.value })} /></div>
        <div className="col-md-3"><select className="form-select" value={q.department} onChange={(e) => setQ({ ...q, department: e.target.value })}><option value="">All departments</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></div>
        <div className="col-md-2"><button className="btn btn-primary w-100" onClick={reload}>Search</button></div>
      </div></div>
      <Alert>{err}</Alert>
      <div className="row g-3">
        <div className={detail ? 'col-lg-7' : 'col-12'}><div className="table-responsive card"><table className="table table-hover mb-0 align-middle">
          <thead><tr><th>Name</th><th>Roll</th><th>Dept</th><th>CGPA</th><th>Backlogs</th><th>Resume</th></tr></thead>
          <tbody>{list?.map((s) => (
            <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => api('admin/students/' + s.id).then(setDetail)}>
              <td>{s.name}</td><td>{s.roll_no}</td><td>{s.department}</td><td>{s.cgpa ?? '-'}</td><td>{s.backlogs}</td><td>{s.resume_file ? 'Yes' : 'No'}</td>
            </tr>))}</tbody>
        </table></div></div>
        {detail && <div className="col-lg-5"><div className="card p-3">
          <div className="d-flex justify-content-between"><h6>{detail.name}</h6><button className="btn-close" onClick={() => setDetail(null)} /></div>
          <div className="small">{detail.email} · {detail.phone}</div>
          <div className="small mb-2">{detail.department} · Year {detail.year} · CGPA {detail.cgpa ?? '-'} · Backlogs {detail.backlogs}</div>
          {[['Skills', 'skills'], ['About', 'about'], ['Projects', 'projects'], ['Certifications', 'certifications'], ['Achievements', 'achievements'], ['Internships', 'internships']].map(([l, k]) => detail[k] && <div className="small mb-1" key={k}><strong>{l}:</strong> <span className="pre-wrap">{detail[k]}</span></div>)}
          {detail.resume_url && <a className="small" href={FILE_HOST + detail.resume_url} target="_blank" rel="noreferrer">Open resume</a>}
          <button className="btn btn-sm btn-outline-danger mt-3" onClick={() => remove(detail.user_id)}>Delete student</button>
        </div></div>}
      </div>
    </>
  );
}
