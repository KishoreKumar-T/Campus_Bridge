import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Badge, fmtDate, useFetch } from '../ui.jsx';

export default function StudentHome() {
  const [ann] = useFetch(() => api('announcements'));
  const [apps] = useFetch(() => api('student/applications'));
  const [drives] = useFetch(() => api('student/drives'));
  const count = (s) => apps?.filter((a) => a.status === s).length ?? 0;
  const eligible = drives?.filter((d) => d.eligible && !d.application_status && !d.expired).length ?? 0;
  const stats = [['Applications', apps?.length ?? 0], ['Shortlisted', count('shortlisted') + count('interview')], ['Selected', count('selected')], ['Open for you', eligible]];
  return (
    <>
      <h4 className="mb-3">Welcome</h4>
      <div className="row g-3 mb-4">
        {stats.map(([l, n]) => <div className="col-6 col-md-3" key={l}><div className="card p-3 text-center"><div className="stat-num text-primary">{n}</div><div className="small text-muted">{l}</div></div></div>)}
      </div>
      <div className="row g-4">
        <div className="col-lg-7">
          <h6>Placement announcements</h6>
          {ann?.map((a) => <div className="card mb-2" key={a.id}><div className="card-body py-2"><strong>{a.title}</strong><div className="small pre-wrap">{a.body}</div><div className="small text-muted">{fmtDate(a.created_at)}</div></div></div>)}
          {ann?.length === 0 && <div className="text-muted">No announcements.</div>}
        </div>
        <div className="col-lg-5">
          <h6>Upcoming interviews</h6>
          {apps?.filter((a) => a.scheduled_at).map((a) => <div className="card mb-2" key={a.id}><div className="card-body py-2"><strong>{a.company}</strong> – {a.title}<div className="small">{new Date(a.scheduled_at.replace(' ', 'T')).toLocaleString()} · {a.mode} {a.location && `· ${a.location}`}</div></div></div>)}
          {!apps?.some((a) => a.scheduled_at) && <div className="text-muted small">None scheduled.</div>}
          <Link className="btn btn-primary btn-sm mt-2" to="/student/drives">Browse opportunities</Link>
        </div>
      </div>
    </>
  );
}
