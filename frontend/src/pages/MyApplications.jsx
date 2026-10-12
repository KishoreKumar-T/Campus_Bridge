import { api } from '../api.js';
import { Alert, Badge, fmt, fmtDate, useFetch } from '../ui.jsx';

export default function MyApplications() {
  const [list, err] = useFetch(() => api('student/applications'));
  return (
    <>
      <h4 className="mb-3">My Applications</h4>
      <Alert>{err}</Alert>
      <div className="table-responsive card"><table className="table mb-0 align-middle">
        <thead><tr><th>Company</th><th>Role</th><th>Applied</th><th>Status</th><th>Interview</th></tr></thead>
        <tbody>
          {list?.map((a) => (
            <tr key={a.id}>
              <td>{a.company}</td><td>{a.title}<div className="small text-muted text-capitalize">{a.type}</div></td><td>{fmtDate(a.applied_at)}</td><td><Badge text={a.status} /></td>
              <td className="small">{a.scheduled_at ? <>{fmt(a.scheduled_at)}<br />{a.mode} {a.location && `· ${a.location}`}</> : '-'}</td>
            </tr>
          ))}
          {list?.length === 0 && <tr><td colSpan="5" className="text-muted">You have not applied to any drive yet.</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}
