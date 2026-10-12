import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Badge, fmtDate, useFetch } from '../ui.jsx';

// Students see requests they sent; alumni see requests they received and can answer
export default function Connections() {
  const { user } = useAuth();
  const [list, err, reload] = useFetch(() => api('connections'));
  const respond = async (id, status) => { await api('connections/' + id, { method: 'PUT', body: { status } }); reload(); };
  return (
    <>
      <h4 className="mb-3">{user.role === 'alumni' ? 'Connection & Mentorship Requests' : 'My Connections'}</h4>
      <Alert>{err}</Alert>
      <div className="table-responsive card"><table className="table mb-0 align-middle">
        <thead><tr><th>{user.role === 'alumni' ? 'Student' : 'Alumni'}</th><th>Type</th><th>Message</th><th>Date</th><th>Status</th>{user.role === 'alumni' && <th />}</tr></thead>
        <tbody>
          {list?.map((c) => (
            <tr key={c.id}>
              <td>{c.other_name}<div className="small text-muted">{c.company || c.other_email}</div></td>
              <td className="text-capitalize">{c.type}</td><td className="small">{c.message}</td><td>{fmtDate(c.created_at)}</td><td><Badge text={c.status} /></td>
              {user.role === 'alumni' && <td>{c.status === 'pending' && <>
                <button className="btn btn-sm btn-success me-1" onClick={() => respond(c.id, 'accepted')}>Accept</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => respond(c.id, 'declined')}>Decline</button></>}</td>}
            </tr>
          ))}
          {list?.length === 0 && <tr><td colSpan="6" className="text-muted">Nothing here yet.</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}
