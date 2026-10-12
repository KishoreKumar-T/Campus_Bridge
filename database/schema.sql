-- CareerBridge database. Import in phpMyAdmin (Import tab) or:  mysql -u root < schema.sql
DROP DATABASE IF EXISTS careerbridge;
CREATE DATABASE careerbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE careerbridge;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','alumni','admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE auth_tokens (
  token CHAR(64) PRIMARY KEY,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE student_profiles (
  user_id INT PRIMARY KEY,
  roll_no VARCHAR(30),
  department VARCHAR(20) NOT NULL DEFAULT 'CSE',
  year TINYINT DEFAULT 3,
  cgpa DECIMAL(4,2) NULL,
  backlogs INT NOT NULL DEFAULT 0,
  phone VARCHAR(20),
  skills VARCHAR(500),
  projects TEXT,
  certifications TEXT,
  achievements TEXT,
  internships TEXT,
  about TEXT,
  resume_file VARCHAR(120),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE alumni_profiles (
  user_id INT PRIMARY KEY,
  department VARCHAR(20),
  grad_year INT,
  company VARCHAR(100),
  designation VARCHAR(100),
  skills VARCHAR(500),
  bio TEXT,
  open_to_mentor TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  industry VARCHAR(100),
  website VARCHAR(150),
  contact_email VARCHAR(120),
  description TEXT
) ENGINE=InnoDB;

CREATE TABLE drives (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  type ENUM('placement','internship') NOT NULL DEFAULT 'placement',
  description TEXT,
  package_lpa DECIMAL(5,2) NULL,          -- package (LPA) or stipend
  location VARCHAR(100),
  deadline DATETIME NOT NULL,
  min_cgpa DECIMAL(4,2) NOT NULL DEFAULT 0,
  max_backlogs INT NOT NULL DEFAULT 0,
  allowed_departments VARCHAR(100) DEFAULT '',   -- e.g. 'CSE,IT' ; empty = all departments
  status ENUM('open','closed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  drive_id INT NOT NULL,
  student_id INT NOT NULL,
  status ENUM('applied','shortlisted','interview','selected','rejected') NOT NULL DEFAULT 'applied',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_application (drive_id, student_id),
  FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE interviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  scheduled_at DATETIME NOT NULL,
  mode ENUM('online','offline') DEFAULT 'offline',
  location VARCHAR(150),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE placements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL UNIQUE,
  student_id INT NOT NULL,
  drive_id INT NOT NULL,
  package_lpa DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  alumni_id INT NOT NULL,
  type ENUM('connect','mentorship') NOT NULL DEFAULT 'connect',
  message VARCHAR(500),
  status ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_request (student_id, alumni_id, type),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (alumni_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE alumni_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alumni_id INT NOT NULL,
  kind ENUM('guidance','opportunity') NOT NULL DEFAULT 'guidance',
  title VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alumni_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  body TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(300) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===================== DEMO DATA (all passwords: password123) =====================
INSERT INTO users (id, name, email, password_hash, role) VALUES
 (1, 'Placement Officer', 'admin@college.edu', '$2y$10$.pDfzp74o3ZmkmIdDlSjgeXsRJGniUjPjJN26N5qB2m3llPP/6w/6', 'admin'),
 (2, 'Arun Kumar',   'arun@student.edu',   '$2y$10$.pDfzp74o3ZmkmIdDlSjgeXsRJGniUjPjJN26N5qB2m3llPP/6w/6', 'student'),
 (3, 'Divya Sri',    'divya@student.edu',  '$2y$10$.pDfzp74o3ZmkmIdDlSjgeXsRJGniUjPjJN26N5qB2m3llPP/6w/6', 'student'),
 (4, 'Karthik R',    'karthik@student.edu','$2y$10$.pDfzp74o3ZmkmIdDlSjgeXsRJGniUjPjJN26N5qB2m3llPP/6w/6', 'student'),
 (5, 'Meena S',      'meena@student.edu',  '$2y$10$.pDfzp74o3ZmkmIdDlSjgeXsRJGniUjPjJN26N5qB2m3llPP/6w/6', 'student'),
 (6, 'Rahul V',      'rahul@student.edu',  '$2y$10$.pDfzp74o3ZmkmIdDlSjgeXsRJGniUjPjJN26N5qB2m3llPP/6w/6', 'student'),
 (7, 'Priya Nair',   'priya@alumni.edu',   '$2y$10$.pDfzp74o3ZmkmIdDlSjgeXsRJGniUjPjJN26N5qB2m3llPP/6w/6', 'alumni'),
 (8, 'Vikram Rao',   'vikram@alumni.edu',  '$2y$10$.pDfzp74o3ZmkmIdDlSjgeXsRJGniUjPjJN26N5qB2m3llPP/6w/6', 'alumni'),
 (9, 'Sneha Iyer',   'sneha@alumni.edu',   '$2y$10$.pDfzp74o3ZmkmIdDlSjgeXsRJGniUjPjJN26N5qB2m3llPP/6w/6', 'alumni');

INSERT INTO student_profiles (user_id, roll_no, department, year, cgpa, backlogs, phone, skills, projects, certifications, achievements, internships, about) VALUES
 (2, '22CS101', 'CSE', 4, 8.60, 0, '9000000001', 'React, JavaScript, PHP, MySQL', 'CareerBridge portal; Library system', 'Oracle Java SE', 'Hackathon finalist', 'Web intern at a local startup', 'Full-stack enthusiast.'),
 (3, '22IT102',  'IT',  4, 7.40, 0, '9000000002', 'Python, SQL, Data Analysis', 'Sales dashboard', 'Google Data Analytics', NULL, NULL, 'Interested in data roles.'),
 (4, '22CS103', 'CSE', 4, 6.80, 1, '9000000003', 'Java, C++', 'Banking app', NULL, NULL, NULL, NULL),
 (5, '22EC104', 'ECE', 4, 8.10, 0, '9000000004', 'Embedded C, IoT, Python', 'Smart home IoT', 'NPTEL IoT', 'Paper presentation', NULL, NULL),
 (6, '22CS105', 'CSE', 4, 9.10, 0, '9000000005', 'Java, Spring, React, AWS', 'Cloud file share', 'AWS Cloud Practitioner', 'College topper', 'Cloud intern', 'Backend and cloud.');

INSERT INTO alumni_profiles (user_id, department, grad_year, company, designation, skills, bio, open_to_mentor) VALUES
 (7, 'CSE', 2020, 'Zoho',  'Software Engineer',  'Java, Backend, System Design', 'Happy to help with interview prep.', 1),
 (8, 'IT',  2018, 'Infosys', 'Senior Analyst',   'Python, Data Engineering, SQL', 'Data engineering mentor.', 1),
 (9, 'ECE', 2021, 'Bosch', 'Embedded Engineer',  'Embedded C, IoT', 'Ask me about embedded careers.', 0);

INSERT INTO companies (id, name, industry, website, contact_email, description) VALUES
 (1, 'TechNova Solutions', 'Software Services', 'https://technova.example', 'hr@technova.example', 'Product and services company.'),
 (2, 'DataWave Analytics', 'Data & AI', 'https://datawave.example', 'careers@datawave.example', 'Analytics consulting.'),
 (3, 'CloudNest', 'Cloud Computing', 'https://cloudnest.example', 'jobs@cloudnest.example', 'Cloud infrastructure startup.');

INSERT INTO drives (id, company_id, title, type, description, package_lpa, location, deadline, min_cgpa, max_backlogs, allowed_departments, status) VALUES
 (1, 1, 'Software Engineer', 'placement',  'Full-stack role. Online test + 2 interviews.', 6.50, 'Chennai',   DATE_ADD(NOW(), INTERVAL 30 DAY), 7.50, 0, 'CSE,IT', 'open'),
 (2, 2, 'Data Analyst Intern', 'internship', '6-month internship with PPO chance.',        0.40, 'Remote',    DATE_ADD(NOW(), INTERVAL 20 DAY), 7.00, 1, '',       'open'),
 (3, 3, 'Cloud Engineer', 'placement',     'AWS / DevOps role.',                           8.00, 'Bengaluru', DATE_ADD(NOW(), INTERVAL 45 DAY), 8.50, 0, 'CSE',    'open');

INSERT INTO applications (id, drive_id, student_id, status) VALUES
 (1, 1, 2, 'shortlisted'), (2, 1, 6, 'selected'), (3, 2, 3, 'applied');
INSERT INTO interviews (application_id, scheduled_at, mode, location) VALUES
 (1, DATE_ADD(NOW(), INTERVAL 7 DAY), 'offline', 'Placement Cell, Block A');
INSERT INTO placements (application_id, student_id, drive_id, package_lpa) VALUES (2, 6, 1, 6.50);

INSERT INTO announcements (title, body) VALUES
 ('Pre-placement talk this Friday', 'TechNova Solutions will conduct a pre-placement talk in the seminar hall at 10 AM.'),
 ('Update your resumes', 'All final-year students must upload an updated PDF resume before the next drive.');
INSERT INTO alumni_posts (alumni_id, kind, title, body) VALUES
 (7, 'guidance', 'How I prepared for product-company interviews', 'Focus on DSA basics, one solid project and clear fundamentals of DBMS and OS.'),
 (8, 'opportunity', 'Referral openings for freshers', 'Our team is hiring data trainees. Message me with your resume.');
INSERT INTO connections (student_id, alumni_id, type, message, status) VALUES
 (2, 7, 'mentorship', 'Sir, I would like guidance on backend interviews.', 'pending');
INSERT INTO notifications (user_id, message) VALUES
 (2, 'You have been shortlisted for Software Engineer at TechNova Solutions.'),
 (6, 'Congratulations! You are selected for Software Engineer at TechNova Solutions.');
