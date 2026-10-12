import { useState } from 'react';
import { api } from '../api.js';
import { Alert, Input, Textarea, fmtDate, useFetch } from '../ui.jsx';

export default function AdminAnnouncements() {
  const [list, err, reload] = useFetch(() => api('announcements'));
  const [f, setF] = useState({ title: '', body: '' });
  const [msg, setMsg] = useState('');
  const add = async (e) => {
    e.preventDefault();
    try { await api('admin/announcements', { method: 'POST', body: f }); setF({ title: '', body: '' }); setMsg(''); reload(); } catch (x) { setMsg(x.message); }
  };
  const del = async (id) => { await api('admin/announcements/' + id, { method: 'DELETE' }); reload(); };
  return (
    <div className="row g-4">
      <div className="col-lg-7">
        <h4 className="mb-3">Announcements</h4><Alert>{err}</Alert>
        {list?.map((a) => <div className="card mb-2" key={a.id}><div className="card-body py-2 d-flex justify-content-between">
          <div><strong>{a.title}</strong><div className="small pre-wrap">{a.body}</div><div className="small text-muted">{fmtDate(a.created_at)}</div></div>
          <button className="btn btn-sm btn-outline-danger align-self-start" onClick={() => del(a.id)}>Delete</button></div></div>)}
      </div>
      <div className="col-lg-5"><div className="card p-3">
        <h6>New announcement (notifies all students)</h6>
        <form onSubmit={add}><Alert>{msg}</Alert>
          <Input label="Title" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <Textarea label="Details" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          <button className="btn btn-primary btn-sm">Publish</button></form>
      </div></div>
    </div>
  );
}
