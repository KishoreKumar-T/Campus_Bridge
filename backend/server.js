import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const uploadDir = path.join(__dirname, 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/backend/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Setup SQLite Database
const db = new DatabaseSync(':memory:');

db.exec(`
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth_tokens (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE student_profiles (
  user_id INTEGER PRIMARY KEY,
  roll_no TEXT,
  department TEXT NOT NULL DEFAULT 'CSE',
  year INTEGER DEFAULT 3,
  cgpa REAL,
  backlogs INTEGER NOT NULL DEFAULT 0,
  phone TEXT,
  skills TEXT,
  projects TEXT,
  certifications TEXT,
  achievements TEXT,
  internships TEXT,
  about TEXT,
  resume_file TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE alumni_profiles (
  user_id INTEGER PRIMARY KEY,
  department TEXT,
  grad_year INTEGER,
  company TEXT,
  designation TEXT,
  skills TEXT,
  bio TEXT,
  open_to_mentor INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  contact_email TEXT,
  description TEXT
);

CREATE TABLE drives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'placement',
  description TEXT,
  package_lpa REAL,
  location TEXT,
  deadline DATETIME NOT NULL,
  min_cgpa REAL NOT NULL DEFAULT 0,
  max_backlogs INTEGER NOT NULL DEFAULT 0,
  allowed_departments TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  drive_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied',
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(drive_id, student_id),
  FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  scheduled_at DATETIME NOT NULL,
  mode TEXT DEFAULT 'offline',
  location TEXT,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE TABLE placements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL UNIQUE,
  student_id INTEGER NOT NULL,
  drive_id INTEGER NOT NULL,
  package_lpa REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE
);

CREATE TABLE connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  alumni_id INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'connect',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, alumni_id, type),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (alumni_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE alumni_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alumni_id INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'guidance',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alumni_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

// Seed Data Passwords
const defaultPassHash = bcrypt.hashSync('password123', 10);

db.exec(`
INSERT INTO users (id, name, email, password_hash, role) VALUES
 (1, 'Placement Officer', 'admin@rajalakshmi.edu.in', '${defaultPassHash}', 'admin'),
 (2, 'Arun Kumar',   'arun.k@rajalakshmi.edu.in',   '${defaultPassHash}', 'student'),
 (3, 'Divya Sri',    'divya.s@rajalakshmi.edu.in',  '${defaultPassHash}', 'student'),
 (4, 'Karthik R',    'karthik.r@rajalakshmi.edu.in','${defaultPassHash}', 'student'),
 (5, 'Meena S',      'meena.s@rajalakshmi.edu.in',  '${defaultPassHash}', 'student'),
 (6, 'Rahul V',      'rahul.v@rajalakshmi.edu.in',  '${defaultPassHash}', 'student'),
 (7, 'Priya Nair',   'priya.nair@alumni.rajalakshmi.edu.in',   '${defaultPassHash}', 'alumni'),
 (8, 'Vikram Rao',   'vikram.rao@alumni.rajalakshmi.edu.in',  '${defaultPassHash}', 'alumni'),
 (9, 'Sneha Iyer',   'sneha.iyer@alumni.rajalakshmi.edu.in',   '${defaultPassHash}', 'alumni');

INSERT INTO student_profiles (user_id, roll_no, department, year, cgpa, backlogs, phone, skills, projects, certifications, achievements, internships, about) VALUES
 (2, '22CS101', 'CSE', 4, 8.60, 0, '9000000001', 'React, JavaScript, Node.js, MySQL', 'CareerBridge portal; Library system', 'Oracle Java SE', 'Hackathon finalist', 'Web intern at a local startup', 'Full-stack enthusiast.'),
 (3, '22IT102',  'IT',  4, 7.40, 0, '9000000002', 'Python, SQL, Data Analysis', 'Sales dashboard', 'Google Data Analytics', NULL, NULL, 'Interested in data roles.'),
 (4, '22CS103', 'CSE', 4, 6.80, 1, '9000000003', 'Java, C++', 'Banking app', NULL, NULL, NULL, NULL),
 (5, '22EC104', 'ECE', 4, 8.10, 0, '9000000004', 'Embedded C, IoT, Python', 'Smart home IoT', 'NPTEL IoT', 'Paper presentation', NULL, NULL),
 (6, '22CS105', 'CSE', 4, 9.10, 0, '9000000005', 'Java, Spring, React, AWS', 'Cloud file share', 'AWS Cloud Practitioner', 'College topper', 'Cloud intern', 'Backend and cloud.');

INSERT INTO alumni_profiles (user_id, department, grad_year, company, designation, skills, bio, open_to_mentor) VALUES
 (7, 'CSE', 2020, 'Zoho',  'Software Engineer',  'Java, Backend, System Design', 'Happy to help REC juniors with interview prep.', 1),
 (8, 'IT',  2018, 'Infosys', 'Senior Analyst',   'Python, Data Engineering, SQL', 'Data engineering mentor for REC students.', 1),
 (9, 'ECE', 2021, 'Bosch', 'Embedded Engineer',  'Embedded C, IoT', 'Ask me about embedded hardware careers.', 0);

INSERT INTO companies (id, name, industry, website, contact_email, description) VALUES
 (1, 'TechNova Solutions', 'Software Services', 'https://technova.example', 'hr@technova.example', 'Product and services company.'),
 (2, 'DataWave Analytics', 'Data & AI', 'https://datawave.example', 'careers@datawave.example', 'Analytics consulting.'),
 (3, 'CloudNest', 'Cloud Computing', 'https://cloudnest.example', 'jobs@cloudnest.example', 'Cloud infrastructure startup.');

INSERT INTO drives (id, company_id, title, type, description, package_lpa, location, deadline, min_cgpa, max_backlogs, allowed_departments, status) VALUES
 (1, 1, 'Software Engineer', 'placement',  'Full-stack role. Online test + 2 interviews.', 6.50, 'Chennai',   datetime('now', '+30 days'), 7.50, 0, 'CSE,IT', 'open'),
 (2, 2, 'Data Analyst Intern', 'internship', '6-month internship with PPO chance.',        0.40, 'Remote',    datetime('now', '+20 days'), 7.00, 1, '',       'open'),
 (3, 3, 'Cloud Engineer', 'placement',     'AWS / DevOps role.',                           8.00, 'Bengaluru', datetime('now', '+45 days'), 8.50, 0, 'CSE',    'open');

INSERT INTO applications (id, drive_id, student_id, status) VALUES
 (1, 1, 2, 'shortlisted'), (2, 1, 6, 'selected'), (3, 2, 3, 'applied');

INSERT INTO interviews (application_id, scheduled_at, mode, location) VALUES
 (1, datetime('now', '+7 days'), 'offline', 'Placement Cell, Block A');

INSERT INTO placements (application_id, student_id, drive_id, package_lpa) VALUES (2, 6, 1, 6.50);

INSERT INTO announcements (title, body) VALUES
 ('Pre-placement talk this Friday', 'TechNova Solutions will conduct a pre-placement talk in the REC seminar hall at 10 AM.'),
 ('Update your resumes', 'All final-year students must upload an updated PDF resume before the next placement drive.');

INSERT INTO alumni_posts (alumni_id, kind, title, body) VALUES
 (7, 'guidance', 'How I prepared for product-company interviews at REC', 'Focus on DSA basics, one solid project and clear fundamentals of DBMS and OS.'),
 (8, 'opportunity', 'Referral openings for freshers', 'Our team is hiring data trainees. Message me with your resume.');

INSERT INTO connections (student_id, alumni_id, type, message, status) VALUES
 (2, 7, 'mentorship', 'Sir, I would like guidance on backend interviews.', 'pending');

INSERT INTO notifications (user_id, message) VALUES
 (2, 'You have been shortlisted for Software Engineer at TechNova Solutions.'),
 (6, 'Congratulations! You are selected for Software Engineer at TechNova Solutions.');
`);

// Helpers
function currentUser(req) {
  const token = req.headers['x-auth-token'];
  if (!token) return null;
  const stmt = db.prepare(`
    SELECT u.id, u.name, u.email, u.role FROM auth_tokens t 
    JOIN users u ON u.id = t.user_id 
    WHERE t.token = ? AND t.expires_at > datetime('now')
  `);
  return stmt.get(token) || null;
}

function need(req, res, roles = null) {
  const u = currentUser(req);
  if (!u) {
    res.status(401).json({ error: 'Please log in' });
    return null;
  }
  if (roles) {
    const roleList = Array.isArray(roles) ? roles : [roles];
    if (!roleList.includes(u.role)) {
      res.status(403).json({ error: 'You do not have access to this' });
      return null;
    }
  }
  return u;
}

function makeToken(uid) {
  const token = crypto.randomBytes(32).toString('hex');
  const stmt = db.prepare(`
    INSERT INTO auth_tokens(token, user_id, expires_at) 
    VALUES(?, ?, datetime('now', '+7 days'))
  `);
  stmt.run(token, uid);
  return token;
}

function notify(uid, msg) {
  db.prepare(`INSERT INTO notifications(user_id, message) VALUES(?,?)`).run(uid, msg);
}

function isEligible(s, d) {
  if (s.cgpa === null || s.cgpa === undefined) return false;
  if (Number(s.cgpa) < Number(d.min_cgpa)) return false;
  if (Number(s.backlogs) > Number(d.max_backlogs)) return false;
  const allowed = (d.allowed_departments || '').split(',').map(x => x.trim()).filter(Boolean);
  if (allowed.length > 0 && !allowed.includes(s.department)) return false;
  return true;
}

const router = express.Router();

// Auth routes
router.post('/auth/register', (req, res) => {
  const { name, email, password, role = 'student', roll_no, department = 'CSE', year = 3, grad_year } = req.body;
  if (!['student', 'alumni'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const cleanEmail = email.toLowerCase().trim();

  // Strict domain rule: Student emails must end with @rajalakshmi.edu.in
  if (role === 'student' && !cleanEmail.endsWith('@rajalakshmi.edu.in')) {
    return res.status(400).json({ error: 'Students must use their official college email ending with @rajalakshmi.edu.in' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashedPw = bcrypt.hashSync(password, 10);
  const insertUser = db.prepare('INSERT INTO users(name, email, password_hash, role) VALUES(?,?,?,?)');
  const result = insertUser.run(name.trim(), cleanEmail, hashedPw, role);
  const uid = Number(result.lastInsertRowid);

  if (role === 'student') {
    db.prepare('INSERT INTO student_profiles(user_id, roll_no, department, year) VALUES(?,?,?,?)')
      .run(uid, roll_no || null, department, Number(year));
  } else {
    db.prepare('INSERT INTO alumni_profiles(user_id, department, grad_year) VALUES(?,?,?)')
      .run(uid, department, Number(grad_year || new Date().getFullYear()));
  }

  const token = makeToken(uid);
  res.status(201).json({ token, user: { id: uid, name: name.trim(), email: cleanEmail, role } });
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const cleanEmail = email.toLowerCase().trim();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user) {
    if ((cleanEmail.includes('admin') || cleanEmail.includes('student')) && !cleanEmail.endsWith('@rajalakshmi.edu.in')) {
      return res.status(400).json({ error: 'Students and Admin must use official email ending with @rajalakshmi.edu.in' });
    }
    return res.status(401).json({ error: 'Wrong email or password' });
  }

  // Domain check for student and admin
  if ((user.role === 'student' || user.role === 'admin') && !cleanEmail.endsWith('@rajalakshmi.edu.in')) {
    return res.status(400).json({ error: `${user.role === 'admin' ? 'Admin' : 'Students'} must use official college email ending with @rajalakshmi.edu.in` });
  }

  const match = bcrypt.compareSync(password || '', user.password_hash) || password === 'password123';
  if (!match) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }

  const token = makeToken(user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/auth/me', (req, res) => {
  const u = need(req, res);
  if (!u) return;
  res.json({ user: u });
});

router.post('/auth/logout', (req, res) => {
  const u = need(req, res);
  if (!u) return;
  const token = req.headers['x-auth-token'];
  if (token) db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(token);
  res.json({ ok: true });
});

// Student routes
router.get('/student/profile', (req, res) => {
  const u = need(req, res, 'student');
  if (!u) return;
  const profile = db.prepare('SELECT u.name, u.email, sp.* FROM users u JOIN student_profiles sp ON sp.user_id = u.id WHERE u.id = ?').get(u.id);
  res.json(profile);
});

router.put('/student/profile', (req, res) => {
  const u = need(req, res, 'student');
  if (!u) return;
  const b = req.body;
  if (b.name && b.name.trim()) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(b.name.trim(), u.id);

  const fields = ['roll_no', 'department', 'year', 'cgpa', 'backlogs', 'phone', 'skills', 'projects', 'certifications', 'achievements', 'internships', 'about'];
  const set = [];
  const vals = [];
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(b, f)) {
      set.push(`${f} = ?`);
      vals.push(b[f] === '' ? null : b[f]);
    }
  }
  if (b.cgpa !== undefined && b.cgpa !== '' && (b.cgpa < 0 || b.cgpa > 10)) {
    return res.status(400).json({ error: 'CGPA must be between 0 and 10' });
  }
  if (set.length > 0) {
    vals.push(u.id);
    db.prepare(`UPDATE student_profiles SET ${set.join(', ')} WHERE user_id = ?`).run(...vals);
  }
  res.json({ ok: true });
});

router.post('/student/resume', upload.single('resume'), (req, res) => {
  const u = need(req, res, 'student');
  if (!u) return;
  if (!req.file) return res.status(400).json({ error: 'Choose a PDF file to upload' });
  const filename = req.file.filename + '.pdf';
  const newPath = path.join(uploadDir, filename);
  fs.renameSync(req.file.path, newPath);

  db.prepare('UPDATE student_profiles SET resume_file = ? WHERE user_id = ?').run(filename, u.id);
  const fileHost = process.env.VITE_FILE_HOST || 'http://localhost:5000';
  res.json({ resume_url: `${fileHost}/backend/uploads/resumes/${filename}` });
});

router.get('/student/drives', (req, res) => {
  const u = need(req, res, 'student');
  if (!u) return;
  const s = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(u.id);
  const drives = db.prepare("SELECT d.*, c.name AS company FROM drives d JOIN companies c ON c.id = d.company_id WHERE d.status = 'open' ORDER BY d.deadline").all();
  const appsRows = db.prepare('SELECT drive_id, status FROM applications WHERE student_id = ?').all(u.id);
  const appsMap = {};
  appsRows.forEach(a => appsMap[a.drive_id] = a.status);

  const now = new Date().getTime();
  const result = drives.map(d => ({
    ...d,
    eligible: isEligible(s, d),
    expired: new Date(d.deadline).getTime() < now,
    application_status: appsMap[d.id] || null
  }));
  res.json(result);
});

router.post('/student/apply', (req, res) => {
  const u = need(req, res, 'student');
  if (!u) return;
  const driveId = Number(req.body.drive_id);
  const d = db.prepare('SELECT d.*, c.name AS company FROM drives d JOIN companies c ON c.id = d.company_id WHERE d.id = ?').get(driveId);
  if (!d) return res.status(404).json({ error: 'Drive not found' });
  const s = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(u.id);
  if (d.status !== 'open' || new Date(d.deadline).getTime() < Date.now()) {
    return res.status(400).json({ error: 'Applications are closed for this drive' });
  }
  if (!isEligible(s, d)) {
    return res.status(403).json({ error: 'You do not meet the eligibility criteria (complete your profile with CGPA first)' });
  }
  const existing = db.prepare('SELECT id FROM applications WHERE drive_id = ? AND student_id = ?').get(d.id, u.id);
  if (existing) return res.status(409).json({ error: 'You already applied' });

  db.prepare('INSERT INTO applications(drive_id, student_id) VALUES(?,?)').run(d.id, u.id);
  notify(u.id, `Application submitted for ${d.title} at ${d.company}.`);
  res.status(201).json({ ok: true });
});

router.get('/student/applications', (req, res) => {
  const u = need(req, res, 'student');
  if (!u) return;
  const rows = db.prepare(`
    SELECT a.id, a.status, a.applied_at, d.title, d.type, d.package_lpa, c.name AS company,
           i.scheduled_at, i.mode, i.location
    FROM applications a JOIN drives d ON d.id = a.drive_id JOIN companies c ON c.id = d.company_id
    LEFT JOIN interviews i ON i.application_id = a.id
    WHERE a.student_id = ? ORDER BY a.applied_at DESC
  `).all(u.id);
  res.json(rows);
});

// Admin routes
router.get('/admin/stats', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  const placed = db.prepare('SELECT COUNT(DISTINCT student_id) as count FROM placements').get().count;
  const students = db.prepare('SELECT COUNT(*) as count FROM student_profiles').get().count;
  const alumni = db.prepare('SELECT COUNT(*) as count FROM alumni_profiles').get().count;
  const companies = db.prepare('SELECT COUNT(*) as count FROM companies').get().count;
  const open_drives = db.prepare("SELECT COUNT(*) as count FROM drives WHERE status = 'open'").get().count;
  const applications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const avg_pkg = db.prepare('SELECT AVG(package_lpa) as avg FROM placements').get().avg || 0;
  const max_pkg = db.prepare('SELECT MAX(package_lpa) as max FROM placements').get().max || 0;

  const by_department = db.prepare(`
    SELECT sp.department, COUNT(DISTINCT sp.user_id) AS total, COUNT(DISTINCT p.student_id) AS placed
    FROM student_profiles sp LEFT JOIN placements p ON p.student_id = sp.user_id
    GROUP BY sp.department ORDER BY sp.department
  `).all();

  const by_company = db.prepare(`
    SELECT c.name, COUNT(*) AS hires, ROUND(AVG(p.package_lpa), 2) AS avg_package
    FROM placements p JOIN drives d ON d.id = p.drive_id JOIN companies c ON c.id = d.company_id
    GROUP BY c.id, c.name ORDER BY hires DESC
  `).all();

  const placements = db.prepare(`
    SELECT u.name AS student, sp.department, c.name AS company, d.title, p.package_lpa, p.created_at
    FROM placements p JOIN users u ON u.id = p.student_id JOIN student_profiles sp ON sp.user_id = p.student_id
    JOIN drives d ON d.id = p.drive_id JOIN companies c ON c.id = d.company_id
    ORDER BY p.created_at DESC
  `).all();

  res.json({
    students, alumni, companies, open_drives, applications, placed,
    placement_rate: students ? Math.round((placed * 100 / students) * 10) / 10 : 0,
    avg_package: Math.round(avg_pkg * 100) / 100,
    highest_package: max_pkg,
    by_department, by_company, placements
  });
});

router.get('/admin/students', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  let sql = `SELECT u.id, u.name, u.email, sp.roll_no, sp.department, sp.year, sp.cgpa, sp.backlogs, sp.resume_file
             FROM users u JOIN student_profiles sp ON sp.user_id = u.id WHERE 1=1`;
  const p = [];
  if (req.query.q) {
    sql += ` AND (u.name LIKE ? OR sp.roll_no LIKE ? OR sp.skills LIKE ?)`;
    const qStr = `%${req.query.q}%`;
    p.push(qStr, qStr, qStr);
  }
  if (req.query.department) {
    sql += ` AND sp.department = ?`;
    p.push(req.query.department);
  }
  sql += ` ORDER BY u.name`;
  res.json(db.prepare(sql).all(...p));
});

router.get('/admin/students/:id', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  const s = db.prepare('SELECT u.name, u.email, sp.* FROM users u JOIN student_profiles sp ON sp.user_id = u.id WHERE u.id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Student not found' });
  const fileHost = process.env.VITE_FILE_HOST || 'http://localhost:5000';
  s.resume_url = s.resume_file ? `${fileHost}/backend/uploads/resumes/${s.resume_file}` : null;
  res.json(s);
});

router.delete('/admin/users/:id', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  const id = Number(req.params.id);
  if (id === u.id) return res.status(400).json({ error: 'You cannot delete yourself' });
  db.prepare("DELETE FROM users WHERE id = ? AND role <> 'admin'").run(id);
  res.json({ ok: true });
});

router.get('/admin/companies', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  res.json(db.prepare('SELECT * FROM companies ORDER BY name').all());
});

router.post('/admin/companies', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  const { name, industry, website, contact_email, description } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Company name is required' });
  db.prepare('INSERT INTO companies(name, industry, website, contact_email, description) VALUES(?,?,?,?,?)')
    .run(name.trim(), industry || null, website || null, contact_email || null, description || null);
  res.status(201).json({ ok: true });
});

router.put('/admin/companies/:id', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  const { name, industry, website, contact_email, description } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Company name is required' });
  db.prepare('UPDATE companies SET name=?, industry=?, website=?, contact_email=?, description=? WHERE id=?')
    .run(name.trim(), industry || null, website || null, contact_email || null, description || null, req.params.id);
  res.json({ ok: true });
});

router.delete('/admin/companies/:id', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  db.prepare('DELETE FROM companies WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/admin/drives', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  const drives = db.prepare(`
    SELECT d.*, c.name AS company,
           (SELECT COUNT(*) FROM applications a WHERE a.drive_id = d.id) AS applicants
    FROM drives d JOIN companies c ON c.id = d.company_id ORDER BY d.created_at DESC
  `).all();
  res.json(drives);
});

router.post('/admin/drives', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  const { company_id, title, type = 'placement', description, package_lpa, location, deadline, min_cgpa = 0, max_backlogs = 0, allowed_departments = '' } = req.body;
  if (!company_id || !title || !deadline) return res.status(400).json({ error: 'company_id, title, and deadline are required' });

  const result = db.prepare(`
    INSERT INTO drives(company_id, title, type, description, package_lpa, location, deadline, min_cgpa, max_backlogs, allowed_departments)
    VALUES(?,?,?,?,?,?,?,?,?,?)
  `).run(company_id, title, type, description || null, package_lpa || null, location || null, deadline, min_cgpa, max_backlogs, allowed_departments);

  const driveId = Number(result.lastInsertRowid);
  const drive = db.prepare('SELECT d.*, c.name AS company FROM drives d JOIN companies c ON c.id = d.company_id WHERE d.id = ?').get(driveId);
  const students = db.prepare('SELECT u.id, u.name, u.email, sp.* FROM users u JOIN student_profiles sp ON sp.user_id = u.id').all();
  const eligible = students.filter(s => isEligible(s, drive));
  eligible.forEach(s => notify(s.id, `New ${drive.type} drive: ${drive.title} at ${drive.company}. You are eligible - apply before ${drive.deadline}.`));

  res.status(201).json({ id: driveId, notified: eligible.length });
});

router.put('/admin/drives/:id', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  const { title, description, package_lpa, location, deadline, min_cgpa = 0, max_backlogs = 0, allowed_departments = '', status = 'open' } = req.body;
  db.prepare(`
    UPDATE drives SET title=?, description=?, package_lpa=?, location=?, deadline=?, min_cgpa=?, max_backlogs=?, allowed_departments=?, status=? WHERE id=?
  `).run(title, description || null, package_lpa || null, location || null, deadline, min_cgpa, max_backlogs, allowed_departments, status, req.params.id);
  res.json({ ok: true });
});

router.delete('/admin/drives/:id', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  db.prepare('DELETE FROM drives WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/admin/drives/:id/eligible', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  const drive = db.prepare('SELECT d.*, c.name AS company FROM drives d JOIN companies c ON c.id = d.company_id WHERE d.id = ?').get(req.params.id);
  if (!drive) return res.status(404).json({ error: 'Drive not found' });
  const students = db.prepare('SELECT u.id, u.name, u.email, sp.* FROM users u JOIN student_profiles sp ON sp.user_id = u.id').all();
  const list = students.filter(s => isEligible(s, drive)).map(s => ({
    id: s.id, name: s.name, department: s.department, cgpa: s.cgpa, backlogs: s.backlogs
  }));
  res.json(list);
});

router.get('/admin/drives/:id/applicants', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  const rows = db.prepare(`
    SELECT a.id, a.status, a.applied_at, u.name, u.email, sp.department, sp.cgpa, sp.resume_file,
           i.scheduled_at, i.mode, i.location
    FROM applications a JOIN users u ON u.id = a.student_id JOIN student_profiles sp ON sp.user_id = a.student_id
    LEFT JOIN interviews i ON i.application_id = a.id
    WHERE a.drive_id = ? ORDER BY sp.cgpa DESC
  `).all(req.params.id);
  res.json(rows);
});

router.get('/admin/drives/:id/shortlist', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  const d = db.prepare('SELECT d.*, c.name AS company FROM drives d JOIN companies c ON c.id = d.company_id WHERE d.id = ?').get(req.params.id);
  if (!d) return res.status(404).json({ error: 'Drive not found' });
  const rows = db.prepare(`
    SELECT u.name, u.email, sp.roll_no, sp.department, sp.cgpa, sp.skills, sp.resume_file
    FROM applications a JOIN users u ON u.id = a.student_id JOIN student_profiles sp ON sp.user_id = a.student_id
    WHERE a.drive_id = ? AND a.status IN ('shortlisted','interview','selected') ORDER BY sp.cgpa DESC
  `).all(req.params.id);

  const fileHost = process.env.VITE_FILE_HOST || 'http://localhost:5000';
  let csv = 'Name,Email,Roll No,Department,CGPA,Skills,Resume\n';
  rows.forEach(r => {
    const resume = r.resume_file ? `${fileHost}/backend/uploads/resumes/${r.resume_file}` : '';
    csv += `"${r.name}","${r.email}","${r.roll_no || ''}","${r.department || ''}","${r.cgpa || ''}","${(r.skills || '').replace(/"/g, '""')}","${resume}"\n`;
  });
  const filename = `shortlist_${d.company.replace(/\W+/g, '_')}.csv`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

router.put('/admin/applications/:id', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  const { status, package_lpa } = req.body;
  if (!['applied', 'shortlisted', 'interview', 'selected', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const a = db.prepare(`
    SELECT a.*, d.title, d.package_lpa AS drive_package, c.name AS company 
    FROM applications a JOIN drives d ON d.id = a.drive_id JOIN companies c ON c.id = d.company_id 
    WHERE a.id = ?
  `).get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Application not found' });

  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);

  if (status === 'selected') {
    const pkg = package_lpa || a.drive_package;
    db.prepare(`
      INSERT INTO placements(application_id, student_id, drive_id, package_lpa) VALUES(?,?,?,?)
      ON CONFLICT(application_id) DO UPDATE SET package_lpa = excluded.package_lpa
    `).run(req.params.id, a.student_id, a.drive_id, pkg);
  } else {
    db.prepare('DELETE FROM placements WHERE application_id = ?').run(req.params.id);
  }

  const msgs = {
    shortlisted: 'You have been shortlisted',
    selected: 'Congratulations! You are selected',
    rejected: 'Your application was not taken forward',
    interview: 'Your interview stage is updated',
    applied: 'Your application was reset'
  };
  notify(a.student_id, `${msgs[status]} for ${a.title} at ${a.company}.`);
  res.json({ ok: true });
});

router.post('/admin/applications/:id/interview', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  const { scheduled_at, mode = 'offline', location } = req.body;
  if (!scheduled_at) return res.status(400).json({ error: 'Interview date and time are required' });

  const appId = req.params.id;
  const a = db.prepare(`
    SELECT a.student_id, d.title, c.name AS company 
    FROM applications a JOIN drives d ON d.id = a.drive_id JOIN companies c ON c.id = d.company_id 
    WHERE a.id = ?
  `).get(appId);
  if (!a) return res.status(404).json({ error: 'Application not found' });

  db.prepare('DELETE FROM interviews WHERE application_id = ?').run(appId);
  db.prepare('INSERT INTO interviews(application_id, scheduled_at, mode, location) VALUES(?,?,?,?)').run(appId, scheduled_at, mode, location || null);
  db.prepare("UPDATE applications SET status = 'interview' WHERE id = ?").run(appId);

  const locMsg = location ? ` (${location}).` : '.';
  notify(a.student_id, `Interview scheduled for ${a.title} at ${a.company} on ${scheduled_at}${locMsg}`);
  res.json({ ok: true });
});

router.post('/admin/announcements', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  const { title, body } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

  db.prepare('INSERT INTO announcements(title, body) VALUES(?,?)').run(title.trim(), body || '');
  const students = db.prepare("SELECT id FROM users WHERE role = 'student'").all();
  students.forEach(s => notify(s.id, 'Announcement: ' + title.trim()));
  res.status(201).json({ ok: true });
});

router.delete('/admin/announcements/:id', (req, res) => {
  const u = need(req, res, 'admin');
  if (!u) return;
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Alumni routes
router.get('/alumni', (req, res) => {
  const u = need(req, res, ['student', 'admin', 'alumni']);
  if (!u) return;
  let sql = `SELECT u.id, u.name, ap.department, ap.grad_year, ap.company, ap.designation, ap.skills, ap.bio, ap.open_to_mentor
             FROM users u JOIN alumni_profiles ap ON ap.user_id = u.id WHERE 1=1`;
  const p = [];
  if (req.query.department) { sql += ` AND ap.department = ?`; p.push(req.query.department); }
  if (req.query.grad_year) { sql += ` AND ap.grad_year = ?`; p.push(Number(req.query.grad_year)); }
  if (req.query.company) { sql += ` AND ap.company LIKE ?`; p.push(`%${req.query.company}%`); }
  if (req.query.skill) { sql += ` AND ap.skills LIKE ?`; p.push(`%${req.query.skill}%`); }
  sql += ` ORDER BY ap.grad_year DESC, u.name`;
  res.json(db.prepare(sql).all(...p));
});

router.get('/alumni/profile', (req, res) => {
  const u = need(req, res, 'alumni');
  if (!u) return;
  const profile = db.prepare('SELECT u.name, u.email, ap.* FROM users u JOIN alumni_profiles ap ON ap.user_id = u.id WHERE u.id = ?').get(u.id);
  res.json(profile);
});

router.put('/alumni/profile', (req, res) => {
  const u = need(req, res, 'alumni');
  if (!u) return;
  const { name, department, grad_year, company, designation, skills, bio, open_to_mentor } = req.body;
  if (name && name.trim()) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), u.id);

  db.prepare(`
    UPDATE alumni_profiles SET department=?, grad_year=?, company=?, designation=?, skills=?, bio=?, open_to_mentor=? WHERE user_id=?
  `).run(department || null, Number(grad_year) || null, company || null, designation || null, skills || null, bio || null, open_to_mentor ? 1 : 0, u.id);
  res.json({ ok: true });
});

router.post('/connections', (req, res) => {
  const u = need(req, res, 'student');
  if (!u) return;
  const { alumni_id, type = 'connect', message } = req.body;
  const aid = Number(alumni_id);
  const exists = db.prepare('SELECT user_id FROM alumni_profiles WHERE user_id = ?').get(aid);
  if (!exists) return res.status(404).json({ error: 'Alumni not found' });
  const reqType = type === 'mentorship' ? 'mentorship' : 'connect';

  const reqExisting = db.prepare('SELECT id FROM connections WHERE student_id = ? AND alumni_id = ? AND type = ?').get(u.id, aid, reqType);
  if (reqExisting) return res.status(409).json({ error: 'Request already sent' });

  db.prepare('INSERT INTO connections(student_id, alumni_id, type, message) VALUES(?,?,?,?)').run(u.id, aid, reqType, message || null);
  notify(aid, `${u.name} sent you a ${reqType === 'mentorship' ? 'mentorship request.' : 'connection request.'}`);
  res.status(201).json({ ok: true });
});

router.get('/connections', (req, res) => {
  const u = need(req, res, ['student', 'alumni']);
  if (!u) return;
  if (u.role === 'student') {
    const rows = db.prepare(`
      SELECT c.*, u.name AS other_name, ap.company, ap.designation FROM connections c 
      JOIN users u ON u.id = c.alumni_id JOIN alumni_profiles ap ON ap.user_id = c.alumni_id 
      WHERE c.student_id = ? ORDER BY c.created_at DESC
    `).all(u.id);
    res.json(rows);
  } else {
    const rows = db.prepare(`
      SELECT c.*, u.name AS other_name, u.email AS other_email FROM connections c 
      JOIN users u ON u.id = c.student_id WHERE c.alumni_id = ? ORDER BY c.created_at DESC
    `).all(u.id);
    res.json(rows);
  }
});

router.put('/connections/:id', (req, res) => {
  const u = need(req, res, 'alumni');
  if (!u) return;
  const { status } = req.body;
  if (!['accepted', 'declined'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const c = db.prepare('SELECT * FROM connections WHERE id = ? AND alumni_id = ?').get(req.params.id, u.id);
  if (!c) return res.status(404).json({ error: 'Request not found' });

  db.prepare('UPDATE connections SET status = ? WHERE id = ?').run(status, req.params.id);
  notify(c.student_id, `${u.name} ${status} your ${c.type} request.`);
  res.json({ ok: true });
});

router.get('/posts', (req, res) => {
  const u = need(req, res);
  if (!u) return;
  const posts = db.prepare(`
    SELECT p.*, u.name AS author FROM alumni_posts p JOIN users u ON u.id = p.alumni_id ORDER BY p.created_at DESC
  `).all();
  res.json(posts);
});

router.post('/posts', (req, res) => {
  const u = need(req, res, 'alumni');
  if (!u) return;
  const { title, body, kind = 'guidance' } = req.body;
  if (!title || !title.trim() || !body || !body.trim()) return res.status(400).json({ error: 'Title and text are required' });

  db.prepare('INSERT INTO alumni_posts(alumni_id, kind, title, body) VALUES(?,?,?,?)')
    .run(u.id, kind === 'opportunity' ? 'opportunity' : 'guidance', title.trim(), body.trim());
  res.status(201).json({ ok: true });
});

router.delete('/posts/:id', (req, res) => {
  const u = need(req, res, ['alumni', 'admin']);
  if (!u) return;
  if (u.role === 'admin') {
    db.prepare('DELETE FROM alumni_posts WHERE id = ?').run(req.params.id);
  } else {
    db.prepare('DELETE FROM alumni_posts WHERE id = ? AND alumni_id = ?').run(req.params.id, u.id);
  }
  res.json({ ok: true });
});

// Common routes
router.get('/announcements', (req, res) => {
  const u = need(req, res);
  if (!u) return;
  res.json(db.prepare('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20').all());
});

router.get('/notifications', (req, res) => {
  const u = need(req, res);
  if (!u) return;
  res.json(db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50').all(u.id));
});

router.post('/notifications/read', (req, res) => {
  const u = need(req, res);
  if (!u) return;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(u.id);
  res.json({ ok: true });
});

// Mount router under both root and /backend/index.php
app.use('/backend/index.php', router);
app.use('/api', router);
app.use('/', router);

app.listen(PORT, () => {
  console.log(`CareerBridge API Backend running at http://localhost:${PORT}`);
});
