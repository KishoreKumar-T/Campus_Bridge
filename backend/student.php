<?php
function student_profile_get() {
    $u = need('student');
    out(q("SELECT u.name, u.email, sp.* FROM users u JOIN student_profiles sp ON sp.user_id = u.id WHERE u.id = ?", [$u['id']])->fetch());
}

function student_profile_put() {
    $u = need('student'); $b = body();
    if (isset($b['name']) && trim($b['name'])) q("UPDATE users SET name = ? WHERE id = ?", [trim($b['name']), $u['id']]);
    $fields = ['roll_no', 'department', 'year', 'cgpa', 'backlogs', 'phone', 'skills', 'projects', 'certifications', 'achievements', 'internships', 'about'];
    $set = []; $vals = [];
    foreach ($fields as $f) if (array_key_exists($f, $b)) { $set[] = "$f = ?"; $vals[] = ($b[$f] === '' ? null : $b[$f]); }
    if (isset($b['cgpa']) && $b['cgpa'] !== '' && ($b['cgpa'] < 0 || $b['cgpa'] > 10)) fail('CGPA must be between 0 and 10');
    if ($set) { $vals[] = $u['id']; q("UPDATE student_profiles SET " . implode(', ', $set) . " WHERE user_id = ?", $vals); }
    out(['ok' => true]);
}

function student_resume_upload() {
    $u = need('student');
    if (empty($_FILES['resume']) || $_FILES['resume']['error'] !== UPLOAD_ERR_OK) fail('Choose a PDF file to upload');
    $f = $_FILES['resume'];
    if ($f['size'] > 2 * 1024 * 1024) fail('Resume must be under 2 MB');
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    if ($mime !== 'application/pdf') fail('Only PDF files are allowed');
    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0777, true);
    $name = 'resume_' . $u['id'] . '_' . bin2hex(random_bytes(4)) . '.pdf';
    if (!move_uploaded_file($f['tmp_name'], UPLOAD_DIR . $name)) fail('Could not save file', 500);
    q("UPDATE student_profiles SET resume_file = ? WHERE user_id = ?", [$name, $u['id']]);
    out(['resume_url' => UPLOAD_URL . $name]);
}

// All open drives, each marked with "eligible" and the student's application status
function student_drives() {
    $u = need('student');
    $s = q("SELECT * FROM student_profiles WHERE user_id = ?", [$u['id']])->fetch();
    $drives = q("SELECT d.*, c.name AS company FROM drives d JOIN companies c ON c.id = d.company_id
                 WHERE d.status = 'open' ORDER BY d.deadline", [])->fetchAll();
    $apps = q("SELECT drive_id, status FROM applications WHERE student_id = ?", [$u['id']])->fetchAll(PDO::FETCH_KEY_PAIR);
    foreach ($drives as &$d) {
        $d['eligible'] = is_eligible($s, $d);
        $d['expired'] = strtotime($d['deadline']) < time();
        $d['application_status'] = $apps[$d['id']] ?? null;
    }
    out($drives);
}

function student_apply() {
    $u = need('student'); $b = body();
    $d = get_drive((int)($b['drive_id'] ?? 0));
    $s = q("SELECT * FROM student_profiles WHERE user_id = ?", [$u['id']])->fetch();
    if ($d['status'] !== 'open' || strtotime($d['deadline']) < time()) fail('Applications are closed for this drive');
    if (!is_eligible($s, $d)) fail('You do not meet the eligibility criteria (complete your profile with CGPA first)', 403);
    if (q("SELECT id FROM applications WHERE drive_id = ? AND student_id = ?", [$d['id'], $u['id']])->fetch()) fail('You already applied', 409);
    q("INSERT INTO applications(drive_id, student_id) VALUES(?,?)", [$d['id'], $u['id']]);
    notify($u['id'], "Application submitted for {$d['title']} at {$d['company']}.");
    out(['ok' => true], 201);
}

function student_applications() {
    $u = need('student');
    out(q("SELECT a.id, a.status, a.applied_at, d.title, d.type, d.package_lpa, c.name AS company,
                  i.scheduled_at, i.mode, i.location
           FROM applications a JOIN drives d ON d.id = a.drive_id JOIN companies c ON c.id = d.company_id
           LEFT JOIN interviews i ON i.application_id = a.id
           WHERE a.student_id = ? ORDER BY a.applied_at DESC", [$u['id']])->fetchAll());
}
