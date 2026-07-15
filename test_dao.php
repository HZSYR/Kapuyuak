<?php
define('INDEX_FILE_LOCATION', 'd:/projek ojs/whileflood.xyz/index.php');
chdir('d:/projek ojs/whileflood.xyz');
require_once './lib/pkp/includes/bootstrap.inc.php';

$username = "unknown";
try {
    $sessionDao = DAORegistry::getDAO('SessionDAO');
    echo "SessionDAO loaded.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
