<?php
function auth_register() {
    $b = body();
    $name = trim($b['name'] ?? ''); $email = strtolower(trim($b['email'] ?? '')); $pw = $b['password'] ?? '';
    $role = $b['role'] ?? 'student';
    if (!in_array($role, ['student', 'alumni'])) fail('Invalid role');
    if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Name and a valid email are required');
    if (strlen($pw) < 6) fail('Password must be at least 6 characters');
    if (q("SELECT id FROM users WHERE email = ?", [$email])->fetch()) fail('Email already registered', 409);

    db()->beginTransaction();
    q("INSERT INTO users(name, email, password_hash, role) VALUES(?,?,?,?)", [$name, $email, password_hash($pw, PASSWORD_DEFAULT), $role]);
    $id = db()->lastInsertId();
    if ($role === 'student') {
        q("INSERT INTO student_profiles(user_id, roll_no, department, year) VALUES(?,?,?,?)",
          [$id, $b['roll_no'] ?? null, $b['department'] ?? 'CSE', (int)($b['year'] ?? 3)]);
    } else {
        q("INSERT INTO alumni_profiles(user_id, department, grad_year) VALUES(?,?,?)",
          [$id, $b['department'] ?? 'CSE', (int)($b['grad_year'] ?? date('Y'))]);
    }
    db()->commit();
    out(['token' => make_token($id), 'user' => ['id' => (int)$id, 'name' => $name, 'email' => $email, 'role' => $role]], 201);
}

function auth_login() {
    $b = body();
    $u = q("SELECT * FROM users WHERE email = ?", [strtolower(trim($b['email'] ?? ''))])->fetch();
    if (!$u || !password_verify($b['password'] ?? '', $u['password_hash'])) fail('Wrong email or password', 401);
    out(['token' => make_token($u['id']), 'user' => ['id' => (int)$u['id'], 'name' => $u['name'], 'email' => $u['email'], 'role' => $u['role']]]);
}

function auth_me() { out(['user' => need()]); }

function auth_logout() {
    need();
    q("DELETE FROM auth_tokens WHERE token = ?", [$_SERVER['HTTP_X_AUTH_TOKEN']]);
    out(['ok' => true]);
}
