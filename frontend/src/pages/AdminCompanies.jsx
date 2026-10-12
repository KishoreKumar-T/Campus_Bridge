import { useState } from 'react';
import { api } from '../api.js';
import { Alert, Input, Textarea, useFetch } from '../ui.jsx';

const EMPTY = { name: '', industry: '', website: '', contact_email: '', description: '' };

export default function AdminCompanies() {
  const [list, err, reload] = useFetch(() => api('admin/companies'));
  const [f, setF] = useState(EMPTY);
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    try { await api('admin/companies' + (f.id ? '/' + f.id : ''), { method: f.id ? 'PUT' : 'POST', body: f }); setF(EMPTY); setMsg(''); reload(); }
    catch (x) { setMsg(x.message); }
  };
  const del = async (id) => { if (confirm('Delete company and its drives?')) { await api('admin/companies/' + id, { method: 'DELETE' }); reload(); } };
  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <h4 className="mb-3">Companies</h4><Alert>{err}</Alert>
        <div className="table-responsive card"><table className="table mb-0 align-middle">
          <thead><tr><th>Name</th><th>Industry</th><th>Contact</th><th /></tr></thead>
          <tbody>{list?.map((c) => (
            <tr key={c.id}><td>{c.name}<div className="small text-muted">{c.website}</div></td><td>{c.industry}</td><td className="small">{c.contact_email}</td>
              <td className="text-end"><button className="btn btn-sm btn-outline-primary me-1" onClick={() => setF(c)}>Edit</button><button className="btn btn-sm btn-outline-danger" onClick={() => del(c.id)}>Delete</button></td></tr>))}</tbody>
        </table></div>
        <p className="small text-muted mt-2">Companies have no login. They send requirements to the Placement Department, which manages everything here.</p>
      </div>
      <div className="col-lg-4"><div className="card p-3">
        <h6>{f.id ? 'Edit company' : 'Add company'}</h6>
        <form onSubmit={save}>
          <Alert>{msg}</Alert>
          <Input label="Name" required value={f.name || ''} onChange={set('name')} />
          <Input label="Industry" value={f.industry || ''} onChange={set('industry')} />
          <Input label="Website" value={f.website || ''} onChange={set('website')} />
          <Input label="HR contact email" type="email" value={f.contact_email || ''} onChange={set('contact_email')} />
          <Textarea label="Description" value={f.description || ''} onChange={set('description')} />
          <button className="btn btn-primary btn-sm me-2">{f.id ? 'Update' : 'Add'}</button>
          {f.id && <button type="button" className="btn btn-sm btn-light" onClick={() => setF(EMPTY)}>Cancel</button>}
        </form>
      </div></div>
    </div>
  );
}
