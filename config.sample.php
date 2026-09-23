<?php
// Copy this file to config.php and fill in your real values.
// config.php is git-ignored so credentials never reach GitHub.
return [
    'db_host'      => '127.0.0.1',
    'db_port'      => '3306',
    'db_name'      => 'family_tree',
    'db_user'      => 'family_tree',
    'db_pass'      => 'change-me',

    // Leave '' to disable API-key auth (local/trusted use only).
    // Set a long random string to require X-Api-Key on every request.
    'api_key'      => '',

    // '*' for any origin, or a comma-separated allow-list.
    'allow_origin' => '*',
];
