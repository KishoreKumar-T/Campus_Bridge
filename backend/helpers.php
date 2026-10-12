<?php
require_once __DIR__ . '/config.php';

// One shared PDO connection (prepared statements = protection from SQL injection)
function db() {
    static $pdo = null;
    if (!$pdo) {
        $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}
// Run a query with parameters and return the statement
function q($sql, $params = []) { $s = db()->prepare($sql); $s->execute($params); return $s; }

function out($data, $code = 200) { http_response_code($code); echo json_encode($data); exit; }
function fail($msg, $code = 400) { out(['error' => $msg], $code); }

// Read JSON body (falls back to form POST)
function body() {
    $d = json_decode(file_get_contents('php://input'), true);
    return is_array($d) ? $d : $_POST;
}

// ---- Authentication: token sent in X-Auth-Token header ----
function current_user() {
    $t = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
    if (!$t) return null;
    $u = q("SELECT u.id, u.name, u.email, u.role FROM auth_tokens t JOIN users u ON u.id = t.user_id
            WHERE t.token = ? AND t.expires_at > NOW()", [$t])->fetch();
    return $u ?: null;
}
// Role-based access: need('admin') or need(['student','alumni'])
function need($roles = null) {
    $u = current_user();
    if (!$u) fail('Please log in', 401);
    if ($roles && !in_array($u['role'], (array)$roles)) fail('You do not have access to this', 403);
    return $u;
}
function make_token($uid) {
    $t = bin2hex(random_bytes(32));
    q("INSERT INTO auth_tokens(token, user_id, expires_at) VALUES(?,?, DATE_ADD(NOW(), INTERVAL " . (int)TOKEN_DAYS . " DAY))", [$t, $uid]);
    return $t;
}

function notify($uid, $msg) { q("INSERT INTO notifications(user_id, message) VALUES(?,?)", [$uid, $msg]); }

// ---- Eligibility engine: CGPA, backlogs and department rules of a drive ----
function is_eligible($s, $d) {
    if ($s['cgpa'] === null) return false;                       // profile not filled yet
    if ((float)$s['cgpa'] < (float)$d['min_cgpa']) return false;
    if ((int)$s['backlogs'] > (int)$d['max_backlogs']) return false;
    $allowed = array_filter(array_map('trim', explode(',', $d['allowed_departments'] ?? '')));
    if ($allowed && !in_array($s['department'], $allowed)) return false;
    return true;
}
function eligible_students($drive) {
    $rows = q("SELECT u.id, u.name, u.email, sp.* FROM users u JOIN student_profiles sp ON sp.user_id = u.id")->fetchAll();
    return array_values(array_filter($rows, fn($s) => is_eligible($s, $drive)));
}
function get_drive($id) {
    $d = q("SELECT d.*, c.name AS company FROM drives d JOIN companies c ON c.id = d.company_id WHERE d.id = ?", [$id])->fetch();
    if (!$d) fail('Drive not found', 404);
    return $d;
}
