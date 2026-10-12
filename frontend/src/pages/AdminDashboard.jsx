import { api } from '../api.js';
import { Alert, useFetch } from '../ui.jsx';

export default function AdminDashboard() {
  const [s, err] = useFetch(() => api('admin/stats'));
  if (err) return <Alert>{err}</Alert>;
  if (!s) return null;
  const cards = [['Students', s.students], ['Alumni', s.alumni], ['Companies', s.companies], ['Open drives', s.open_drives], ['Applications', s.applications],
    ['Placed', s.placed], ['Placement rate', s.placement_rate + '%'], ['Avg package', s.avg_package + ' LPA'], ['Highest', s.highest_package + ' LPA']];
  return (
    <>
      <h4 className="mb-3">Placement Analytics</h4>
      <div className="row g-3 mb-4">
        {cards.map(([l, v]) => <div className="col-6 col-md-4 col-lg-2" key={l}><div className="card p-3 text-center"><div className="stat-num text-primary">{v}</div><div className="small text-muted">{l}</div></div></div>)}
      </div>
      <div className="row g-4">
        <div className="col-lg-6"><div className="card p-3">
          <h6>Department-wise placement</h6>
          {s.by_department.map((d) => {
            const pct = d.total ? Math.round((d.placed * 100) / d.total) : 0;
            return <div className="mb-2" key={d.department}><div className="small d-flex justify-content-between"><span>{d.department}</span><span>{d.placed}/{d.total} ({pct}%)</span></div>
              <div className="progress" style={{ height: 10 }}><div className="progress-bar bg-success" style={{ width: pct + '%' }} /></div></div>;
          })}
        </div></div>
        <div className="col-lg-6"><div className="card p-3">
          <h6>Company-wise hires</h6>
          <table className="table table-sm mb-0"><thead><tr><th>Company</th><th>Hires</th><th>Avg LPA</th></tr></thead>
            <tbody>{s.by_company.map((c) => <tr key={c.name}><td>{c.name}</td><td>{c.hires}</td><td>{c.avg_package}</td></tr>)}
              {s.by_company.length === 0 && <tr><td colSpan="3" className="text-muted">No placements yet.</td></tr>}</tbody></table>
        </div></div>
        <div className="col-12"><div className="card p-3">
          <h6>Placement results</h6>
          <table className="table table-sm mb-0"><thead><tr><th>Student</th><th>Dept</th><th>Company</th><th>Role</th><th>LPA</th></tr></thead>
            <tbody>{s.placements.map((p, i) => <tr key={i}><td>{p.student}</td><td>{p.department}</td><td>{p.company}</td><td>{p.title}</td><td>{p.package_lpa}</td></tr>)}</tbody></table>
        </div></div>
      </div>
    </>
  );
}
