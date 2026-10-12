// Small reusable UI pieces
import { useEffect, useState } from 'react';

export const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'AIDS'];

export function Alert({ type = 'danger', children }) {
  return children ? <div className={`alert alert-${type} py-2`}>{children}</div> : null;
}

export function Input({ label, ...props }) {
  return (
    <div className="mb-3">
      <label className="form-label small fw-semibold">{label}</label>
      <input className="form-control" {...props} />
    </div>
  );
}

export function Select({ label, options, ...props }) {
  return (
    <div className="mb-3">
      <label className="form-label small fw-semibold">{label}</label>
      <select className="form-select" {...props}>
        {options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>))}
      </select>
    </div>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <div className="mb-3">
      <label className="form-label small fw-semibold">{label}</label>
      <textarea className="form-control" rows="3" {...props} />
    </div>
  );
}

const COLORS = { applied: 'secondary', shortlisted: 'info', interview: 'warning', selected: 'success', rejected: 'danger',
  open: 'success', closed: 'secondary', pending: 'warning', accepted: 'success', declined: 'danger' };
export const Badge = ({ text }) => <span className={`badge text-bg-${COLORS[text] || 'secondary'}`}>{text}</span>;

// Loads data from the API when the page opens; returns [data, error, reload]
export function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = () => fn().then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, deps); // eslint-disable-line
  return [data, error, load];
}

export const fmt = (d) => (d ? new Date(d.replace(' ', 'T')).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');
export const fmtDate = (d) => (d ? new Date(d.replace(' ', 'T')).toLocaleDateString([], { dateStyle: 'medium' }) : '');
