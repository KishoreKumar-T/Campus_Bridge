import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Input, Select, Textarea, fmtDate, useFetch } from '../ui.jsx';

// Career guidance & opportunities shared by alumni
export default function Posts() {
  const { user } = useAuth();
  const [posts, err, reload] = useFetch(() => api('posts'));
  const [f, setF] = useState({ kind: 'guidance', title: '', body: '' });
  const [msg, setMsg] = useState('');
  const add = async (e) => {
    e.preventDefault();
    try { await api('posts', { method: 'POST', body: f }); setF({ kind: 'guidance', title: '', body: '' }); setMsg(''); reload(); } catch (x) { setMsg(x.message); }
  };
  const del = async (id) => { await api('posts/' + id, { method: 'DELETE' }); reload(); };
  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <h4 className="mb-3">Alumni Posts</h4>
        <Alert>{err}</Alert>
        {posts?.map((p) => (
          <div className="card mb-3" key={p.id}><div className="card-body">
            <span className={'badge ' + (p.kind === 'opportunity' ? 'text-bg-success' : 'text-bg-info')}>{p.kind}</span>
            <h6 className="mt-2">{p.title}</h6>
            <p className="mb-1 pre-wrap">{p.body}</p>
            <div className="small text-muted">by {p.author} · {fmtDate(p.created_at)}
              {(user.role === 'admin' || +p.alumni_id === user.id) && <button className="btn btn-link btn-sm text-danger" onClick={() => del(p.id)}>Delete</button>}
            </div>
          </div></div>
        ))}
        {posts?.length === 0 && <div className="text-muted">No posts yet.</div>}
      </div>
      {user.role === 'alumni' && (
        <div className="col-lg-4"><div className="card p-3">
          <h6>Share with students</h6>
          <form onSubmit={add}>
            <Alert>{msg}</Alert>
            <Select label="Type" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} options={['guidance', 'opportunity']} />
            <Input label="Title" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <Textarea label="Details" required value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
            <button className="btn btn-primary btn-sm">Post</button>
          </form>
        </div></div>
      )}
    </div>
  );
}
