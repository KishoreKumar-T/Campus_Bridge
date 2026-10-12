<?php
// Alumni directory: filter by department, graduation year, skill or company
function alumni_directory() {
    need(['student', 'admin', 'alumni']);
    $sql = "SELECT u.id, u.name, ap.department, ap.grad_year, ap.company, ap.designation, ap.skills, ap.bio, ap.open_to_mentor
            FROM users u JOIN alumni_profiles ap ON ap.user_id = u.id WHERE 1=1";
    $p = [];
    if (!empty($_GET['department'])) { $sql .= " AND ap.department = ?"; $p[] = $_GET['department']; }
    if (!empty($_GET['grad_year'])) { $sql .= " AND ap.grad_year = ?"; $p[] = (int)$_GET['grad_year']; }
    if (!empty($_GET['company'])) { $sql .= " AND ap.company LIKE ?"; $p[] = '%' . $_GET['company'] . '%'; }
    if (!empty($_GET['skill'])) { $sql .= " AND ap.skills LIKE ?"; $p[] = '%' . $_GET['skill'] . '%'; }
    out(q($sql . " ORDER BY ap.grad_year DESC, u.name", $p)->fetchAll());
}

function alumni_profile_get() {
    $u = need('alumni');
    out(q("SELECT u.name, u.email, ap.* FROM users u JOIN alumni_profiles ap ON ap.user_id = u.id WHERE u.id = ?", [$u['id']])->fetch());
}
function alumni_profile_put() {
    $u = need('alumni'); $b = body();
    if (isset($b['name']) && trim($b['name'])) q("UPDATE users SET name = ? WHERE id = ?", [trim($b['name']), $u['id']]);
    q("UPDATE alumni_profiles SET department=?, grad_year=?, company=?, designation=?, skills=?, bio=?, open_to_mentor=? WHERE user_id=?",
      [$b['department'] ?? null, (int)($b['grad_year'] ?? 0) ?: null, $b['company'] ?? null, $b['designation'] ?? null,
       $b['skills'] ?? null, $b['bio'] ?? null, !empty($b['open_to_mentor']) ? 1 : 0, $u['id']]);
    out(['ok' => true]);
}

// ---------- Connections & mentorship requests ----------
function connection_create() {
    $u = need('student'); $b = body();
    $aid = (int)($b['alumni_id'] ?? 0);
    if (!q("SELECT user_id FROM alumni_profiles WHERE user_id = ?", [$aid])->fetch()) fail('Alumni not found', 404);
    $type = ($b['type'] ?? 'connect') === 'mentorship' ? 'mentorship' : 'connect';
    if (q("SELECT id FROM connections WHERE student_id = ? AND alumni_id = ? AND type = ?", [$u['id'], $aid, $type])->fetch()) fail('Request already sent', 409);
    q("INSERT INTO connections(student_id, alumni_id, type, message) VALUES(?,?,?,?)", [$u['id'], $aid, $type, $b['message'] ?? null]);
    notify($aid, "{$u['name']} sent you a " . ($type === 'mentorship' ? 'mentorship request.' : 'connection request.'));
    out(['ok' => true], 201);
}
function connection_list() {
    $u = need(['student', 'alumni']);
    if ($u['role'] === 'student')
        $sql = "SELECT c.*, u.name AS other_name, ap.company, ap.designation FROM connections c JOIN users u ON u.id = c.alumni_id
                JOIN alumni_profiles ap ON ap.user_id = c.alumni_id WHERE c.student_id = ? ORDER BY c.created_at DESC";
    else
        $sql = "SELECT c.*, u.name AS other_name, u.email AS other_email FROM connections c JOIN users u ON u.id = c.student_id
                WHERE c.alumni_id = ? ORDER BY c.created_at DESC";
    out(q($sql, [$u['id']])->fetchAll());
}
function connection_respond($id) {
    $u = need('alumni'); $b = body();
    $status = $b['status'] ?? '';
    if (!in_array($status, ['accepted', 'declined'])) fail('Invalid status');
    $c = q("SELECT * FROM connections WHERE id = ? AND alumni_id = ?", [$id, $u['id']])->fetch();
    if (!$c) fail('Request not found', 404);
    q("UPDATE connections SET status = ? WHERE id = ?", [$status, $id]);
    notify($c['student_id'], "{$u['name']} {$status} your {$c['type']} request.");
    out(['ok' => true]);
}

// ---------- Alumni posts (career guidance & opportunities) ----------
function posts_list() {
    need();
    out(q("SELECT p.*, u.name AS author FROM alumni_posts p JOIN users u ON u.id = p.alumni_id ORDER BY p.created_at DESC")->fetchAll());
}
function post_create() {
    $u = need('alumni'); $b = body();
    if (!trim($b['title'] ?? '') || !trim($b['body'] ?? '')) fail('Title and text are required');
    q("INSERT INTO alumni_posts(alumni_id, kind, title, body) VALUES(?,?,?,?)",
      [$u['id'], ($b['kind'] ?? 'guidance') === 'opportunity' ? 'opportunity' : 'guidance', trim($b['title']), trim($b['body'])]);
    out(['ok' => true], 201);
}
function post_delete($id) {
    $u = need(['alumni', 'admin']);
    q($u['role'] === 'admin' ? "DELETE FROM alumni_posts WHERE id = ?" : "DELETE FROM alumni_posts WHERE id = ? AND alumni_id = " . (int)$u['id'], [$id]);
    out(['ok' => true]);
}
