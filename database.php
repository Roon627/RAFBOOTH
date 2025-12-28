<?php
// Lightweight DB helper using SQLite for local development

// Provide DB helpers. Prefer PDO+SQLite if available, otherwise fall back to JSON file storage.
function ensure_data_dir()
{
    $dir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    return $dir;
}

function has_sqlite_pdo()
{
    return class_exists('PDO') && in_array('sqlite', PDO::getAvailableDrivers());
}

function db_create_user($username, $password_hash)
{
    if (has_sqlite_pdo()) {
        $dir = ensure_data_dir();
        $path = $dir . DIRECTORY_SEPARATOR . 'spooky_booth.sqlite';
        $db = new PDO('sqlite:' . $path);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )");
        $stmt = $db->prepare('INSERT INTO users (username, password, created_at) VALUES (:u, :p, :t)');
        $stmt->execute([':u' => $username, ':p' => $password_hash, ':t' => time()]);
        return (int)$db->lastInsertId();
    } else {
        $dir = ensure_data_dir();
        $file = $dir . DIRECTORY_SEPARATOR . 'store.json';
        $data = file_exists($file) ? json_decode(file_get_contents($file), true) : ['users' => [], 'photos' => []];
        foreach ($data['users'] as $u) if ($u['username'] === $username) throw new Exception('User exists');
        $id = count($data['users']) + 1;
        $data['users'][] = ['id' => $id, 'username' => $username, 'password' => $password_hash, 'created_at' => time()];
        file_put_contents($file, json_encode($data));
        return $id;
    }
}

function db_find_user_by_username($username)
{
    if (has_sqlite_pdo()) {
        $dir = ensure_data_dir();
        $path = $dir . DIRECTORY_SEPARATOR . 'spooky_booth.sqlite';
        $db = new PDO('sqlite:' . $path);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )");
        $stmt = $db->prepare('SELECT id, username, password FROM users WHERE username = :u LIMIT 1');
        $stmt->execute([':u' => $username]);
        $u = $stmt->fetch(PDO::FETCH_ASSOC);
        return $u ?: null;
    } else {
        $dir = ensure_data_dir();
        $file = $dir . DIRECTORY_SEPARATOR . 'store.json';
        $data = file_exists($file) ? json_decode(file_get_contents($file), true) : ['users' => [], 'photos' => []];
        foreach ($data['users'] as $u) if ($u['username'] === $username) return $u;
        return null;
    }
}

function db_insert_photo($userId, $url, $timestamp)
{
    if (has_sqlite_pdo()) {
        $dir = ensure_data_dir();
        $path = $dir . DIRECTORY_SEPARATOR . 'spooky_booth.sqlite';
        $db = new PDO('sqlite:' . $path);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->exec("CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            url TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )");
        $stmt = $db->prepare('INSERT INTO photos (user_id, url, timestamp) VALUES (:u, :url, :t)');
        $stmt->execute([':u' => $userId, ':url' => $url, ':t' => $timestamp]);
        return (int)$db->lastInsertId();
    } else {
        $dir = ensure_data_dir();
        $file = $dir . DIRECTORY_SEPARATOR . 'store.json';
        $data = file_exists($file) ? json_decode(file_get_contents($file), true) : ['users' => [], 'photos' => []];
        $id = count($data['photos']) + 1;
        $data['photos'][] = ['id' => $id, 'user_id' => $userId, 'url' => $url, 'timestamp' => $timestamp];
        file_put_contents($file, json_encode($data));
        return $id;
    }
}

function db_get_photos_by_user($userId)
{
    if (has_sqlite_pdo()) {
        $dir = ensure_data_dir();
        $path = $dir . DIRECTORY_SEPARATOR . 'spooky_booth.sqlite';
        $db = new PDO('sqlite:' . $path);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $stmt = $db->prepare('SELECT id, url, timestamp FROM photos WHERE user_id = :u ORDER BY id DESC');
        $stmt->execute([':u' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $dir = ensure_data_dir();
        $file = $dir . DIRECTORY_SEPARATOR . 'store.json';
        $data = file_exists($file) ? json_decode(file_get_contents($file), true) : ['users' => [], 'photos' => []];
        $res = [];
        foreach ($data['photos'] as $p) if ($p['user_id'] == $userId) $res[] = $p;
        return array_reverse($res);
    }
}

function db_delete_photo($userId, $id)
{
    if (has_sqlite_pdo()) {
        $dir = ensure_data_dir();
        $path = $dir . DIRECTORY_SEPARATOR . 'spooky_booth.sqlite';
        $db = new PDO('sqlite:' . $path);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $stmt = $db->prepare('DELETE FROM photos WHERE id = :id AND user_id = :u');
        return $stmt->execute([':id' => $id, ':u' => $userId]);
    } else {
        $dir = ensure_data_dir();
        $file = $dir . DIRECTORY_SEPARATOR . 'store.json';
        $data = file_exists($file) ? json_decode(file_get_contents($file), true) : ['users' => [], 'photos' => []];
        $changed = false;
        foreach ($data['photos'] as $i => $p) {
            if ($p['id'] == $id && $p['user_id'] == $userId) {
                array_splice($data['photos'], $i, 1);
                $changed = true;
                break;
            }
        }
        if ($changed) file_put_contents($file, json_encode($data));
        return $changed;
    }
}


?>
