<?php
// ---------- Analytics ----------
function admin_stats() {
    need('admin');
    $one = fn($sql) => q($sql)->fetchColumn();
    $placed = (int)$one("SELECT COUNT(DISTINCT student_id) FROM placements");
    $students = (int)$one("SELECT COUNT(*) FROM student_profiles");
    out([
        'students' => $students,
        'alumni' => (int)$one("SELECT COUNT(*) FROM alumni_profiles"),
        'companies' => (int)$one("SELECT COUNT(*) FROM companies"),
        'open_drives' => (int)$one("SELECT COUNT(*) FROM drives WHERE status = 'open'"),
        'applications' => (int)$one("SELECT COUNT(*) FROM applications"),
        'placed' => $placed,
        'placement_rate' => $students ? round($placed * 100 / $students, 1) : 0,
        'avg_package' => round((float)$one("SELECT AVG(package_lpa) FROM placements"), 2),
        'highest_package' => (float)$one("SELECT MAX(package_lpa) FROM placements"),
        'by_department' => q("SELECT sp.department, COUNT(DISTINCT sp.user_id) AS total, COUNT(DISTINCT p.student_id) AS placed
                              FROM student_profiles sp LEFT JOIN placements p ON p.student_id = sp.user_id
                              GROUP BY sp.department ORDER BY sp.department")->fetchAll(),
        'by_company' => q("SELECT c.name, COUNT(*) AS hires, ROUND(AVG(p.package_lpa), 2) AS avg_package
                           FROM placements p JOIN drives d ON d.id = p.drive_id JOIN companies c ON c.id = d.company_id
                           GROUP BY c.id, c.name ORDER BY hires DESC")->fetchAll(),
        'placements' => q("SELECT u.name AS student, sp.department, c.name AS company, d.title, p.package_lpa, p.created_at
                           FROM placements p JOIN users u ON u.id = p.student_id JOIN student_profiles sp ON sp.user_id = p.student_id
                           JOIN drives d ON d.id = p.drive_id JOIN companies c ON c.id = d.company_id
                           ORDER BY p.created_at DESC")->fetchAll(),
    ]);
}

// ---------- Students / Alumni ----------
function admin_students() {
    need('admin');
    $sql = "SELECT u.id, u.name, u.email, sp.roll_no, sp.department, sp.year, sp.cgpa, sp.backlogs, sp.resume_file
            FROM users u JOIN student_profiles sp ON sp.user_id = u.id WHERE 1=1";
    $p = [];
    if (!empty($_GET['q'])) { $sql .= " AND (u.name LIKE ? OR sp.roll_no LIKE ? OR sp.skills LIKE ?)"; $like = '%' . $_GET['q'] . '%'; array_push($p, $like, $like, $like); }
    if (!empty($_GET['department'])) { $sql .= " AND sp.department = ?"; $p[] = $_GET['department']; }
    out(q($sql . " ORDER BY u.name", $p)->fetchAll());
}
function admin_student_get($id) {
    need('admin');
    $s = q("SELECT u.name, u.email, sp.* FROM users u JOIN student_profiles sp ON sp.user_id = u.id WHERE u.id = ?", [$id])->fetch();
    if (!$s) fail('Student not found', 404);
    $s['resume_url'] = $s['resume_file'] ? UPLOAD_URL . $s['resume_file'] : null;
    out($s);
}
function admin_user_delete($id) {
    $a = need('admin');
    if ($id == $a['id']) fail('You cannot delete yourself');
    q("DELETE FROM users WHERE id = ? AND role <> 'admin'", [$id]);   // child rows removed by ON DELETE CASCADE
    out(['ok' => true]);
}

// ---------- Companies ----------
function admin_companies() { need('admin'); out(q("SELECT * FROM companies ORDER BY name")->fetchAll()); }
function admin_company_save($id = null) {
    need('admin'); $b = body();
    if (!trim($b['name'] ?? '')) fail('Company name is required');
    $v = [trim($b['name']), $b['industry'] ?? null, $b['website'] ?? null, $b['contact_email'] ?? null, $b['description'] ?? null];
    if ($id) { $v[] = $id; q("UPDATE companies SET name=?, industry=?, website=?, contact_email=?, description=? WHERE id=?", $v); }
    else q("INSERT INTO companies(name, industry, website, contact_email, description) VALUES(?,?,?,?,?)", $v);
    out(['ok' => true], $id ? 200 : 201);
}
function admin_company_delete($id) { need('admin'); q("DELETE FROM companies WHERE id = ?", [$id]); out(['ok' => true]); }

// ---------- Drives (recruitment / internship opportunities) ----------
function admin_drives() {
    need('admin');
    out(q("SELECT d.*, c.name AS company,
                  (SELECT COUNT(*) FROM applications a WHERE a.drive_id = d.id) AS applicants
           FROM drives d JOIN companies c ON c.id = d.company_id ORDER BY d.created_at DESC")->fetchAll());
}
function admin_drive_create() {
    need('admin'); $b = body();
    foreach (['company_id', 'title', 'deadline'] as $f) if (empty($b[$f])) fail("$f is required");
    q("INSERT INTO drives(company_id, title, type, description, package_lpa, location, deadline, min_cgpa, max_backlogs, allowed_departments)
       VALUES(?,?,?,?,?,?,?,?,?,?)",
      [$b['company_id'], $b['title'], $b['type'] ?? 'placement', $b['description'] ?? null, $b['package_lpa'] ?: null, $b['location'] ?? null,
       $b['deadline'], $b['min_cgpa'] ?: 0, $b['max_backlogs'] ?? 0, $b['allowed_departments'] ?? '']);
    $id = db()->lastInsertId();
    // Automation: notify every eligible student as soon as the drive is published
    $drive = get_drive($id);
    $list = eligible_students($drive);
    foreach ($list as $s) notify($s['id'], "New {$drive['type']} drive: {$drive['title']} at {$drive['company']}. You are eligible - apply before {$drive['deadline']}.");
    out(['id' => (int)$id, 'notified' => count($list)], 201);
}
function admin_drive_update($id) {
    need('admin'); $b = body();
    q("UPDATE drives SET title=?, description=?, package_lpa=?, location=?, deadline=?, min_cgpa=?, max_backlogs=?, allowed_departments=?, status=? WHERE id=?",
      [$b['title'], $b['description'] ?? null, $b['package_lpa'] ?: null, $b['location'] ?? null, $b['deadline'],
       $b['min_cgpa'] ?: 0, $b['max_backlogs'] ?? 0, $b['allowed_departments'] ?? '', $b['status'] ?? 'open', $id]);
    out(['ok' => true]);
}
function admin_drive_delete($id) { need('admin'); q("DELETE FROM drives WHERE id = ?", [$id]); out(['ok' => true]); }

function admin_drive_eligible($id) {
    need('admin');
    $list = eligible_students(get_drive($id));
    out(array_map(fn($s) => ['id' => $s['id'], 'name' => $s['name'], 'department' => $s['department'], 'cgpa' => $s['cgpa'], 'backlogs' => $s['backlogs']], $list));
}

// ---------- Applicants, shortlisting, interviews, results ----------
function admin_drive_applicants($id) {
    need('admin');
    out(q("SELECT a.id, a.status, a.applied_at, u.name, u.email, sp.department, sp.cgpa, sp.resume_file,
                  i.scheduled_at, i.mode, i.location
           FROM applications a JOIN users u ON u.id = a.student_id JOIN student_profiles sp ON sp.user_id = a.student_id
           LEFT JOIN interviews i ON i.application_id = a.id
           WHERE a.drive_id = ? ORDER BY sp.cgpa DESC", [$id])->fetchAll());
}
function admin_application_status($id) {
    need('admin'); $b = body();
    $status = $b['status'] ?? '';
    if (!in_array($status, ['applied', 'shortlisted', 'interview', 'selected', 'rejected'])) fail('Invalid status');
    $a = q("SELECT a.*, d.title, d.package_lpa, c.name AS company FROM applications a JOIN drives d ON d.id = a.drive_id
            JOIN companies c ON c.id = d.company_id WHERE a.id = ?", [$id])->fetch();
    if (!$a) fail('Application not found', 404);
    q("UPDATE applications SET status = ? WHERE id = ?", [$status, $id]);
    if ($status === 'selected') {   // record the placement result
        $pkg = $b['package_lpa'] ?? $a['package_lpa'];
        q("INSERT INTO placements(application_id, student_id, drive_id, package_lpa) VALUES(?,?,?,?)
           ON DUPLICATE KEY UPDATE package_lpa = VALUES(package_lpa)", [$id, $a['student_id'], $a['drive_id'], $pkg]);
    } else {
        q("DELETE FROM placements WHERE application_id = ?", [$id]);
    }
    $msg = ['shortlisted' => 'You have been shortlisted', 'selected' => 'Congratulations! You are selected',
            'rejected' => 'Your application was not taken forward', 'interview' => 'Your interview stage is updated', 'applied' => 'Your application was reset'][$status];
    notify($a['student_id'], "$msg for {$a['title']} at {$a['company']}.");
    out(['ok' => true]);
}
function admin_interview_save($appId) {
    need('admin'); $b = body();
    if (empty($b['scheduled_at'])) fail('Interview date and time are required');
    $a = q("SELECT a.student_id, d.title, c.name AS company FROM applications a JOIN drives d ON d.id = a.drive_id
            JOIN companies c ON c.id = d.company_id WHERE a.id = ?", [$appId])->fetch();
    if (!$a) fail('Application not found', 404);
    q("DELETE FROM interviews WHERE application_id = ?", [$appId]);
    q("INSERT INTO interviews(application_id, scheduled_at, mode, location) VALUES(?,?,?,?)", [$appId, $b['scheduled_at'], $b['mode'] ?? 'offline', $b['location'] ?? null]);
    q("UPDATE applications SET status = 'interview' WHERE id = ?", [$appId]);
    notify($a['student_id'], "Interview scheduled for {$a['title']} at {$a['company']} on {$b['scheduled_at']}" . (!empty($b['location']) ? " ({$b['location']})." : '.'));
    out(['ok' => true]);
}
// CSV of shortlisted candidates - this is what the Placement Dept shares with the company
function admin_drive_shortlist_csv($id) {
    need('admin');
    $d = get_drive($id);
    $rows = q("SELECT u.name, u.email, sp.roll_no, sp.department, sp.cgpa, sp.skills, sp.resume_file
               FROM applications a JOIN users u ON u.id = a.student_id JOIN student_profiles sp ON sp.user_id = a.student_id
               WHERE a.drive_id = ? AND a.status IN ('shortlisted','interview','selected') ORDER BY sp.cgpa DESC", [$id])->fetchAll();
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="shortlist_' . preg_replace('/\W+/', '_', $d['company']) . '.csv"');
    $f = fopen('php://output', 'w');
    fputcsv($f, ['Name', 'Email', 'Roll No', 'Department', 'CGPA', 'Skills', 'Resume']);
    foreach ($rows as $r) fputcsv($f, [$r['name'], $r['email'], $r['roll_no'], $r['department'], $r['cgpa'], $r['skills'], $r['resume_file'] ? UPLOAD_URL . $r['resume_file'] : '']);
    exit;
}

// ---------- Announcements ----------
function admin_announcement_create() {
    need('admin'); $b = body();
    if (!trim($b['title'] ?? '')) fail('Title is required');
    q("INSERT INTO announcements(title, body) VALUES(?,?)", [trim($b['title']), $b['body'] ?? '']);
    foreach (q("SELECT id FROM users WHERE role = 'student'")->fetchAll() as $s) notify($s['id'], 'Announcement: ' . trim($b['title']));
    out(['ok' => true], 201);
}
function admin_announcement_delete($id) { need('admin'); q("DELETE FROM announcements WHERE id = ?", [$id]); out(['ok' => true]); }
