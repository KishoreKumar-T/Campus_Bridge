<?php
// ---- Database settings (XAMPP defaults) ----
define('DB_HOST', 'localhost');
define('DB_NAME', 'careerbridge');
define('DB_USER', 'root');
define('DB_PASS', '');

// ---- Resume uploads ----
define('UPLOAD_DIR', __DIR__ . '/uploads/resumes/');
define('UPLOAD_URL', '/careerbridge/backend/uploads/resumes/'); // public URL path
define('TOKEN_DAYS', 7);
