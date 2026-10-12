<?php
// Front controller: every API request enters here and is sent to one function.
// URL style:  /careerbridge/backend/index.php/student/profile
ini_set('display_errors', '0');                  // never print PHP warnings into JSON
error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE & ~E_DEPRECATED);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;     // CORS pre-flight
header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/helpers.php';
foreach (['auth', 'student', 'admin', 'alumni', 'common'] as $f) require __DIR__ . "/$f.php";

$path = $_SERVER['PATH_INFO'] ?? '';
if ($path === '' && isset($_SERVER['REQUEST_URI'])) {
    $uri = strtok($_SERVER['REQUEST_URI'], '?');
    $pos = strpos($uri, 'index.php');
    $path = $pos !== false ? substr($uri, $pos + 9) : '';
}
$path = trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];

// 'METHOD path' => function.  {id} is a number passed to the function.
$routes = [
    'POST auth/register' => 'auth_register',
    'POST auth/login' => 'auth_login',
    'GET auth/me' => 'auth_me',
    'POST auth/logout' => 'auth_logout',

    'GET student/profile' => 'student_profile_get',
    'PUT student/profile' => 'student_profile_put',
    'POST student/resume' => 'student_resume_upload',
    'GET student/drives' => 'student_drives',
    'POST student/apply' => 'student_apply',
    'GET student/applications' => 'student_applications',

    'GET admin/stats' => 'admin_stats',
    'GET admin/students' => 'admin_students',
    'GET admin/students/{id}' => 'admin_student_get',
    'DELETE admin/users/{id}' => 'admin_user_delete',
    'GET admin/companies' => 'admin_companies',
    'POST admin/companies' => 'admin_company_save',
    'PUT admin/companies/{id}' => 'admin_company_save',
    'DELETE admin/companies/{id}' => 'admin_company_delete',
    'GET admin/drives' => 'admin_drives',
    'POST admin/drives' => 'admin_drive_create',
    'PUT admin/drives/{id}' => 'admin_drive_update',
    'DELETE admin/drives/{id}' => 'admin_drive_delete',
    'GET admin/drives/{id}/eligible' => 'admin_drive_eligible',
    'GET admin/drives/{id}/applicants' => 'admin_drive_applicants',
    'GET admin/drives/{id}/shortlist' => 'admin_drive_shortlist_csv',
    'PUT admin/applications/{id}' => 'admin_application_status',
    'POST admin/applications/{id}/interview' => 'admin_interview_save',
    'POST admin/announcements' => 'admin_announcement_create',
    'DELETE admin/announcements/{id}' => 'admin_announcement_delete',

    'GET alumni' => 'alumni_directory',
    'GET alumni/profile' => 'alumni_profile_get',
    'PUT alumni/profile' => 'alumni_profile_put',
    'POST connections' => 'connection_create',
    'GET connections' => 'connection_list',
    'PUT connections/{id}' => 'connection_respond',
    'GET posts' => 'posts_list',
    'POST posts' => 'post_create',
    'DELETE posts/{id}' => 'post_delete',

    'GET announcements' => 'announcements_list',
    'GET notifications' => 'notifications_list',
    'POST notifications/read' => 'notifications_read',
];

try {
    foreach ($routes as $route => $fn) {
        [$m, $pattern] = explode(' ', $route, 2);
        if ($m !== $method) continue;
        $regex = '#^' . str_replace('{id}', '(\d+)', $pattern) . '$#';
        if (preg_match($regex, $path, $match)) { array_shift($match); $fn(...array_map('intval', $match)); }
    }
    fail('Route not found: ' . $method . ' /' . $path, 404);
} catch (PDOException $e) {
    fail('Database error: ' . $e->getMessage(), 500);
}
