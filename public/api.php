<?php
// ═══════════════════════════════════════════════════════════════
// Family Tree Research — PHP API  (api.php)
// Place this file in the same directory as index.html
// ═══════════════════════════════════════════════════════════════

declare(strict_types=1);

// Never leak PHP warnings/notices into the JSON response body.
error_reporting(E_ALL);
ini_set('display_errors', '0');
ob_start();

// ── CONFIG LOADING ───────────────────────────────────────────────
// Secrets live in config.php (git-ignored) or in environment vars.
// Never hard-code credentials in this file.
$CFG = [
    'db_host' => getenv('FT_DB_HOST') ?: '127.0.0.1',
    'db_port' => getenv('FT_DB_PORT') ?: '3306',
    'db_name' => getenv('FT_DB_NAME') ?: 'family_tree',
    'db_user' => getenv('FT_DB_USER') ?: 'family_tree',
    'db_pass' => getenv('FT_DB_PASS') ?: '',
    'api_key' => getenv('FT_API_KEY') ?: '',
    // Comma-separated list of allowed origins, or '*' for any.
    'allow_origin' => getenv('FT_ALLOW_ORIGIN') ?: '*',
];

$cfgFile = __DIR__ . '/config.php';
if (is_file($cfgFile)) {
    $local = require $cfgFile;
    if (is_array($local)) {
        $CFG = array_merge($CFG, array_intersect_key($local, $CFG));
    }
}

// ── CORS & HEADERS ───────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $CFG['allow_origin']);
header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── AUTH ─────────────────────────────────────────────────────────
if ($CFG['api_key'] !== '') {
    $supplied = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if (!hash_equals($CFG['api_key'], $supplied)) {
        respond(['error' => 'Unauthorized'], 401);
    }
}

// ── DB CONNECTION ─────────────────────────────────────────────────
try {
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        $CFG['db_host'], $CFG['db_port'], $CFG['db_name']
    );
    $pdo = new PDO($dsn, $CFG['db_user'], $CFG['db_pass'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    respond(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
}

// ── ROUTING ──────────────────────────────────────────────────────
$method   = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$resource = $_GET['r']  ?? '';
$id       = $_GET['id'] ?? '';
$body     = [];

if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
    $raw  = file_get_contents('php://input');
    if ($raw !== false && $raw !== '') {
        $decoded = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            respond(['error' => 'Invalid JSON body: ' . json_last_error_msg()], 400);
        }
        $body = is_array($decoded) ? $decoded : [];
    }
}

try {
    switch ($resource) {
        case 'health':        handleHealth();        break;
        case 'all':           handleAll();           break;
        case 'import':        handleImport();        break;
        case 'persons':       handlePersons();       break;
        case 'couples':       handleCouples();       break;
        case 'parent_child':  handleParentChild();   break;
        default:
            respond(['error' => "Unknown resource: $resource"], 404);
    }
} catch (Throwable $e) {
    respond(['error' => 'Server error: ' . $e->getMessage()], 500);
}

// ════════════════════════════════════════════════════════════════
// HANDLERS
// ════════════════════════════════════════════════════════════════

function handleHealth(): void {
    global $pdo;
    $pdo->query('SELECT 1');
    respond(['ok' => true, 'time' => date('c')]);
}

// ── GET ALL  (used for polling) ───────────────────────────────────
function handleAll(): void {
    global $pdo;
    $persons     = $pdo->query('SELECT * FROM persons     ORDER BY last_name, first_name')->fetchAll();
    $couples     = $pdo->query('SELECT * FROM couples     ORDER BY created_at')->fetchAll();
    $parentChild = $pdo->query('SELECT * FROM parent_child ORDER BY created_at')->fetchAll();
    respond(['persons' => $persons, 'couples' => $couples, 'parent_child' => $parentChild]);
}

// ── IMPORT (replace the whole dataset from a JSON export) ─────────
function handleImport(): void {
    global $pdo, $method, $body;
    if ($method !== 'POST') respond(['error' => 'Method not allowed'], 405);

    $persons = is_array($body['persons'] ?? null) ? $body['persons'] : [];
    $couples = is_array($body['couples'] ?? null) ? $body['couples'] : [];
    $pc      = is_array($body['parent_child'] ?? null) ? $body['parent_child'] : [];

    $pdo->beginTransaction();
    try {
        $pdo->exec('DELETE FROM parent_child');
        $pdo->exec('DELETE FROM couples');
        $pdo->exec('DELETE FROM persons');

        $ip = $pdo->prepare("INSERT INTO persons
            (id, first_name, last_name, maiden_name, gender,
             birth_date, birth_place, death_date, death_place,
             occupation, education, eye_color, hair_color, notes,
             canvas_x, canvas_y)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        foreach ($persons as $r) {
            $ip->execute([
                str($r, 'id') ?: uuid4(),
                str($r, 'first_name'), str($r, 'last_name'), str($r, 'maiden_name'), str($r, 'gender'),
                str($r, 'birth_date'), str($r, 'birth_place'), str($r, 'death_date'), str($r, 'death_place'),
                str($r, 'occupation'), str($r, 'education'), str($r, 'eye_color'), str($r, 'hair_color'),
                str($r, 'notes'), num($r, 'canvas_x'), num($r, 'canvas_y'),
            ]);
        }

        $ic = $pdo->prepare("INSERT INTO couples
            (id, person1_id, person2_id, rel_type,
             start_date, start_place, status, end_date, end_place, line_color)
            VALUES (?,?,?,?,?,?,?,?,?,?)");
        foreach ($couples as $r) {
            $ic->execute([
                str($r, 'id') ?: uuid4(),
                str($r, 'person1_id'), str($r, 'person2_id'),
                str($r, 'rel_type') ?: 'married',
                str($r, 'start_date'), str($r, 'start_place'),
                str($r, 'status') ?: 'active',
                str($r, 'end_date'), str($r, 'end_place'),
                str($r, 'line_color') ?: '#2563eb',
            ]);
        }

        $ipp = $pdo->prepare("INSERT INTO parent_child (id, parent_id, child_id, couple_id) VALUES (?,?,?,?)");
        foreach ($pc as $r) {
            $ipp->execute([
                str($r, 'id') ?: uuid4(),
                str($r, 'parent_id'), str($r, 'child_id'),
                array_key_exists('couple_id', $r) ? (str($r, 'couple_id') ?: null) : null,
            ]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    respond(['success' => true, 'counts' => [
        'persons' => count($persons), 'couples' => count($couples), 'parent_child' => count($pc),
    ]]);
}

// ── PERSONS ───────────────────────────────────────────────────────
function handlePersons(): void {
    global $pdo, $method, $id, $body;

    if ($method === 'GET' && $id === '') {
        respond($pdo->query('SELECT * FROM persons ORDER BY last_name, first_name')->fetchAll());
    }

    if ($method === 'GET' && $id !== '') {
        $st = $pdo->prepare('SELECT * FROM persons WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) respond(['error' => 'Not found'], 404);
        respond($row);
    }

    if ($method === 'POST') {
        $newId = uuid4();
        $pdo->prepare("
            INSERT INTO persons
              (id, first_name, last_name, maiden_name, gender,
               birth_date, birth_place, death_date, death_place,
               occupation, education, eye_color, hair_color, notes,
               canvas_x, canvas_y)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ")->execute([
            $newId,
            str($body, 'first_name'), str($body, 'last_name'),
            str($body, 'maiden_name'), str($body, 'gender'),
            str($body, 'birth_date'), str($body, 'birth_place'),
            str($body, 'death_date'), str($body, 'death_place'),
            str($body, 'occupation'), str($body, 'education'),
            str($body, 'eye_color'),  str($body, 'hair_color'),
            str($body, 'notes'),
            num($body, 'canvas_x'),   num($body, 'canvas_y'),
        ]);
        $st = $pdo->prepare('SELECT * FROM persons WHERE id = ?');
        $st->execute([$newId]);
        respond($st->fetch(), 201);
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        if ($id === '') respond(['error' => 'id required'], 400);
        updatePartial('persons', $id, $body, [
            'first_name', 'last_name', 'maiden_name', 'gender',
            'birth_date', 'birth_place', 'death_date', 'death_place',
            'occupation', 'education', 'eye_color', 'hair_color', 'notes',
        ], ['canvas_x', 'canvas_y']);
        respond(['success' => true]);
    }

    if ($method === 'DELETE') {
        if ($id === '') respond(['error' => 'id required'], 400);
        $pdo->prepare('DELETE FROM persons WHERE id=?')->execute([$id]);
        respond(['success' => true]);
    }

    respond(['error' => 'Method not allowed'], 405);
}

// ── COUPLES ───────────────────────────────────────────────────────
function handleCouples(): void {
    global $pdo, $method, $id, $body;

    if ($method === 'GET' && $id === '') {
        respond($pdo->query('SELECT * FROM couples ORDER BY created_at')->fetchAll());
    }

    if ($method === 'GET' && $id !== '') {
        $st = $pdo->prepare('SELECT * FROM couples WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) respond(['error' => 'Not found'], 404);
        respond($row);
    }

    if ($method === 'POST') {
        $newId = uuid4();
        $pdo->prepare("
            INSERT INTO couples
              (id, person1_id, person2_id, rel_type,
               start_date, start_place, status, end_date, end_place, line_color)
            VALUES (?,?,?,?,?,?,?,?,?,?)
        ")->execute([
            $newId,
            str($body, 'person1_id'), str($body, 'person2_id'),
            str($body, 'rel_type') ?: 'married',
            str($body, 'start_date'), str($body, 'start_place'),
            str($body, 'status') ?: 'active',
            str($body, 'end_date'), str($body, 'end_place'),
            str($body, 'line_color') ?: '#2563eb',
        ]);
        $st = $pdo->prepare('SELECT * FROM couples WHERE id=?');
        $st->execute([$newId]);
        respond($st->fetch(), 201);
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        if ($id === '') respond(['error' => 'id required'], 400);
        updatePartial('couples', $id, $body,
            ['rel_type', 'start_date', 'start_place', 'status', 'end_date', 'end_place', 'line_color'],
            []);
        respond(['success' => true]);
    }

    if ($method === 'DELETE') {
        if ($id === '') respond(['error' => 'id required'], 400);
        $pdo->prepare('DELETE FROM couples WHERE id=?')->execute([$id]);
        respond(['success' => true]);
    }

    respond(['error' => 'Method not allowed'], 405);
}

// ── PARENT_CHILD ──────────────────────────────────────────────────
function handleParentChild(): void {
    global $pdo, $method, $id, $body;

    if ($method === 'GET') {
        respond($pdo->query('SELECT * FROM parent_child ORDER BY created_at')->fetchAll());
    }

    if ($method === 'POST') {
        $newId = uuid4();
        // Ignore duplicate — return existing row if constraint fires
        try {
            $pdo->prepare("
                INSERT INTO parent_child (id, parent_id, child_id, couple_id)
                VALUES (?,?,?,?)
            ")->execute([
                $newId,
                str($body, 'parent_id'),
                str($body, 'child_id'),
                str($body, 'couple_id') ?: null,
            ]);
        } catch (PDOException $e) {
            // 23000 = integrity constraint (duplicate)
            if ($e->getCode() === '23000') {
                $st = $pdo->prepare('SELECT * FROM parent_child WHERE parent_id=? AND child_id=?');
                $st->execute([str($body, 'parent_id'), str($body, 'child_id')]);
                respond($st->fetch(), 200);
            }
            throw $e;
        }
        $st = $pdo->prepare('SELECT * FROM parent_child WHERE id=?');
        $st->execute([$newId]);
        respond($st->fetch(), 201);
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        if ($id === '') respond(['error' => 'id required'], 400);
        // couple_id may be explicitly null to detach — handle it separately.
        if (array_key_exists('couple_id', $body)) {
            $coupleId = str($body, 'couple_id') ?: null;
            $pdo->prepare('UPDATE parent_child SET couple_id=? WHERE id=?')
                ->execute([$coupleId, $id]);
        }
        respond(['success' => true]);
    }

    if ($method === 'DELETE') {
        if ($id === '') respond(['error' => 'id required'], 400);
        $pdo->prepare('DELETE FROM parent_child WHERE id=?')->execute([$id]);
        respond(['success' => true]);
    }

    respond(['error' => 'Method not allowed'], 405);
}

// ════════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════════

/**
 * Update only the columns actually present in the request body.
 * This prevents partial updates (e.g. dragging a card sends only
 * canvas_x/canvas_y) from wiping every other column.
 *
 * @param string[] $stringCols  columns coerced with str()
 * @param string[] $numericCols columns coerced with num()
 */
function updatePartial(string $table, string $id, array $body, array $stringCols, array $numericCols): void {
    global $pdo;
    $sets = [];
    $vals = [];

    foreach ($stringCols as $col) {
        if (array_key_exists($col, $body)) {
            $sets[] = "`$col` = ?";
            $vals[] = str($body, $col);
        }
    }
    foreach ($numericCols as $col) {
        if (array_key_exists($col, $body)) {
            $sets[] = "`$col` = ?";
            $vals[] = num($body, $col);
        }
    }

    if (!$sets) return; // nothing to update
    $vals[] = $id;
    $pdo->prepare("UPDATE `$table` SET " . implode(', ', $sets) . " WHERE id = ?")->execute($vals);
}

function respond(array $data, int $code = 200): never {
    if (ob_get_level() > 0) ob_clean();
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Safely get a trimmed string value from an array, null if missing/empty */
function str(array $arr, string $key): ?string {
    $v = $arr[$key] ?? null;
    if ($v === null || $v === '') return null;
    return trim((string)$v);
}

/** Safely get a numeric value from an array, null if missing/non-numeric */
function num(array $arr, string $key): ?float {
    $v = $arr[$key] ?? null;
    if ($v === null || $v === '') return null;
    return is_numeric($v) ? (float)$v : null;
}

/** RFC 4122 v4 UUID */
function uuid4(): string {
    $b = random_bytes(16);
    $b[6] = chr(ord($b[6]) & 0x0f | 0x40);
    $b[8] = chr(ord($b[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}
