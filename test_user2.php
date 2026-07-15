<?php
define('INDEX_FILE_LOCATION', 'd:/projek ojs/whileflood.xyz/index.php');
chdir('d:/projek ojs/whileflood.xyz');
require_once './lib/pkp/includes/bootstrap.inc.php';

$username = "unknown";
if (class_exists('Application')) {
    try {
        // Try getting session manager
        $sessionManager = SessionManager::getManager();
        if ($sessionManager) {
            $session = $sessionManager->getUserSession();
            if ($session) {
                $user = $session->getUser();
                if ($user) {
                    $username = $user->getUsername();
                }
            }
        }
    } catch (Exception $e) {}
}
echo "Username: " . $username . "\n";
