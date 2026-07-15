<?php
define('INDEX_FILE_LOCATION', 'd:/projek ojs/whileflood.xyz/index.php');
chdir('d:/projek ojs/whileflood.xyz');
require_once './lib/pkp/includes/bootstrap.inc.php';
$req = Application::get()->getRequest();
$user = $req->getUser();
echo $user ? $user->getUsername() : 'No User';
