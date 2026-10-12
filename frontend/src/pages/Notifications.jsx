import { useEffect } from 'react';
import { api } from '../api.js';
import { Alert, fmt, useFetch } from '../ui.jsx';

export default function Notifications() {
  const [list, err, reload] = useFetch(() => api('notifications'));
  useEffect(() => { api('notifications/read', { method: 'POST' }); }, []);   // mark all as read when opened
  return (
    <>
      <h4 className="mb-3">Notifications</h4>
      <Alert>{err}</Alert>
      <div className="list-group">
        {list?.map((n) => (
          <div key={n.id} className={'list-group-item ' + (+n.is_read ? '' : 'fw-semibold')}>
            {n.message} <div className="small text-muted">{fmt(n.created_at)}</div>
          </div>
        ))}
        {list?.length === 0 && <div className="text-muted">No notifications yet.</div>}
      </div>
    </>
  );
}
