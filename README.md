# CareerBridge – College Career, Alumni & Placement Network

React (Vite) + PHP 8 REST API + MySQL (PDO). Three roles: **Student, Alumni, Placement Admin**. Companies have no login – the Placement Department manages them.

## 1. Folder structure
```
careerbridge/
├── database/schema.sql        # tables + demo data (one import)
├── backend/                   # PHP REST API  (goes to htdocs)
│   ├── index.php              # front controller + route table
│   ├── config.php             # DB settings
│   ├── helpers.php            # PDO, JSON output, token auth, roles, eligibility engine
│   ├── auth.php               # register / login / me / logout
│   ├── student.php            # profile, resume upload, drives, apply, applications
│   ├── admin.php              # analytics, students, companies, drives, shortlist, interviews, placements, CSV
│   ├── alumni.php             # directory, profile, connections/mentorship, posts
│   ├── common.php             # announcements, notifications
│   └── uploads/resumes/       # uploaded PDF resumes
└── frontend/                  # React app
    ├── .env                   # API URL
    └── src/ (main.jsx, App.jsx, Layout.jsx, api.js, auth.jsx, ui.jsx, pages/*)
```

## 2. XAMPP setup (Windows)
1. Unzip so the folder is **`C:\xampp\htdocs\careerbridge`** (keep the name `careerbridge`).
2. Start **Apache** and **MySQL** in the XAMPP Control Panel.
3. Open http://localhost/phpmyadmin → **Import** → choose `database/schema.sql` → Go. (This creates the `careerbridge` database with demo data.)
4. If your MySQL root has a password, edit `backend/config.php`.
5. Test the API in the browser: http://localhost/careerbridge/backend/index.php/auth/me  
   You should see `{"error":"Please log in"}` – that means PHP + routing work.

## 3. Run the React app
Install Node.js 18+ once, then:
```
cd C:\xampp\htdocs\careerbridge\frontend
npm install
npm run dev
```
Open **http://localhost:5173**.  
If Apache is not on port 80 or the folder name differs, change `frontend/.env` (`VITE_API_URL`, `VITE_FILE_HOST`) and restart `npm run dev`.

## 4. Demo logins (password for all: `password123`)
| Role | Email | Notes |
|---|---|---|
| Admin (Placement Dept) | admin@college.edu | full control |
| Student | arun@student.edu | CSE, CGPA 8.6, shortlisted + interview scheduled |
| Student | rahul@student.edu | CSE, CGPA 9.1, already selected |
| Student | karthik@student.edu | CGPA 6.8 + 1 backlog (shows "Not eligible") |
| Alumni | priya@alumni.edu | has a pending mentorship request |

## 5. Features
**Student:** register/login, profile (academics, skills, projects, certifications, achievements, internships), PDF resume upload, see eligible drives, apply, track status (applied → shortlisted → interview → selected/rejected), interview details, notifications, alumni search (department / year / skill / company), connect + mentorship requests.  
**Alumni:** profile, accept/decline requests, post career guidance & opportunities.  
**Admin:** analytics dashboard, student profiles (search, view, delete), company CRUD, publish drives/internships with eligibility rules (CGPA, backlogs, departments), **auto-notify eligible students**, view eligible list, shortlist, schedule interviews, select/reject (records placement), **export shortlist CSV for the company**, announcements.

## 6. How React → PHP → MySQL works (viva answer)
1. **React** page calls `api('student/drives')` in `src/api.js`, which does a `fetch()` to `.../index.php/student/drives` and attaches the login token in the `X-Auth-Token` header.
2. **PHP** `index.php` matches `GET student/drives` in its route table and calls `student_drives()`.
3. That function first calls `need('student')` – it looks up the token in the `auth_tokens` table to find the user and checks the **role** (role-based access).
4. It runs a **prepared SQL statement** through **PDO** on MySQL, builds an array and returns it with `json_encode`.
5. React receives the JSON, stores it in state with `useState`, and renders the cards.

**Login:** `password_hash()` stores a bcrypt hash; `password_verify()` checks it; a random 64-char token is saved in `auth_tokens` (7-day expiry) and kept in the browser's localStorage.  
**Eligibility engine:** `is_eligible()` in `helpers.php` compares student CGPA, backlogs and department with the drive's rules. It is used to (a) mark drives as eligible/not eligible, (b) block ineligible applications on the server, (c) notify eligible students when a drive is published.

## 7. Database tables
`users`, `auth_tokens`, `student_profiles`, `alumni_profiles`, `companies`, `drives`, `applications` (unique per drive+student), `interviews`, `placements`, `connections`, `alumni_posts`, `announcements`, `notifications`. Foreign keys use `ON DELETE CASCADE`.

## 8. Common problems
| Problem | Fix |
|---|---|
| Login shows "Failed to fetch" | Apache not running, or `VITE_API_URL` wrong. Open the test URL from step 2.5. |
| "Database error" message | Import `schema.sql` first; check `backend/config.php`. |
| Resume upload fails | Enable `extension=fileinfo` in `php.ini`; file must be a PDF under 2 MB. |
| Changed `.env` but nothing changed | Stop and restart `npm run dev`. |
| Passwords don't work after editing SQL | Demo hash is for `password123`; or register a new user. |

## 9. Ideas to extend
Email notifications, password reset, charts library for analytics, pagination, resume parsing.
