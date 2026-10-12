<?php
function announcements_list() { need(); out(q("SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20")->fetchAll()); }
function notifications_list() {
    $u = need();
    out(q("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50", [$u['id']])->fetchAll());
}
function notifications_read() { $u = need(); q("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [$u['id']]); out(['ok' => true]); }
