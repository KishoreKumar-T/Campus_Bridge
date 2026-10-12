import { useEffect, useRef, useState } from 'react';
import { api, FILE_HOST } from '../api.js';
import { Alert, DEPARTMENTS, Input, Select, Textarea } from '../ui.jsx';

export default function StudentProfile() {
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState({ type: 'success', text: '' });
  const file = useRef();
  useEffect(() => { api('student/profile').then(setF); }, []);
  if (!f) return null;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const say = (type, text) => setMsg({ type, text });

  const save = async (e) => {
    e.preventDefault();
    try { await api('student/profile', { method: 'PUT', body: f }); say('success', 'Profile saved'); } catch (x) { say('danger', x.message); }
  };
  const upload = async () => {
    if (!file.current.files[0]) return say('danger', 'Choose a PDF first');
    const form = new FormData(); form.append('resume', file.current.files[0]);
    try { const r = await api('student/resume', { method: 'POST', form }); setF({ ...f, resume_file: r.resume_url.split('/').pop() }); say('success', 'Resume uploaded'); }
    catch (x) { say('danger', x.message); }
  };
  const done = ['cgpa', 'skills', 'projects', 'resume_file', 'about'].filter((k) => f[k]).length * 20;

  return (
    <div className="row g-4">
      <div className="col-lg-8"><div className="card p-4">
        <h4>My Profile</h4>
        <div className="progress mb-3" style={{ height: 8 }}><div className="progress-bar" style={{ width: done + '%' }} /></div>
        <form onSubmit={save}>
          <Alert type={msg.type}>{msg.text}</Alert>
          <div className="row">
            <div className="col-md-6"><Input label="Name" value={f.name || ''} onChange={set('name')} /></div>
            <div className="col-md-6"><Input label="Roll number" value={f.roll_no || ''} onChange={set('roll_no')} /></div>
            <div className="col-md-4"><Select label="Department" value={f.department} onChange={set('department')} options={DEPARTMENTS} /></div>
            <div className="col-md-2"><Select label="Year" value={f.year || 3} onChange={set('year')} options={[1, 2, 3, 4]} /></div>
            <div className="col-md-3"><Input label="CGPA" type="number" step="0.01" min="0" max="10" value={f.cgpa ?? ''} onChange={set('cgpa')} /></div>
            <div className="col-md-3"><Input label="Current backlogs" type="number" min="0" value={f.backlogs ?? 0} onChange={set('backlogs')} /></div>
          </div>
          <Input label="Phone" value={f.phone || ''} onChange={set('phone')} />
          <Input label="Skills (comma separated)" value={f.skills || ''} onChange={set('skills')} />
          <Textarea label="About me" value={f.about || ''} onChange={set('about')} />
          <Textarea label="Projects" value={f.projects || ''} onChange={set('projects')} />
          <Textarea label="Certifications" value={f.certifications || ''} onChange={set('certifications')} />
          <Textarea label="Achievements" value={f.achievements || ''} onChange={set('achievements')} />
          <Textarea label="Internships" value={f.internships || ''} onChange={set('internships')} />
          <button className="btn btn-primary">Save profile</button>
        </form>
      </div></div>
      <div className="col-lg-4"><div className="card p-4">
        <h6>Resume (PDF, max 2 MB)</h6>
        {f.resume_file ? <a href={`${FILE_HOST}/careerbridge/backend/uploads/resumes/${f.resume_file}`} target="_blank" rel="noreferrer">View current resume</a> : <div className="text-muted small">No resume uploaded.</div>}
        <input ref={file} type="file" accept="application/pdf" className="form-control my-3" />
        <button className="btn btn-outline-primary btn-sm" onClick={upload}>Upload resume</button>
        <div className="small text-muted mt-3">Profile strength: {done}%</div>
      </div></div>
    </div>
  );
}
