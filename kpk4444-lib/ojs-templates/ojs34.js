export const getFullIndexPhp34 = (apiKey, url) => `<?php

use APP\\core\\Application;

/**
 * @file index.php
 *
 * Copyright (c) 2014-2021 Simon Fraser University
 * Copyright (c) 2003-2021 John Willinsky
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * Bootstrap code for OJS 3.4+ site.
 * Kapuyuak Security System - OJS 3.4 Compatible
 * (NO ob_start because of OJS 3.4 Slim/Laminas Response Emitter)
 */

define('INDEX_FILE_LOCATION', __FILE__);

define('KPK4444_API_KEY', '${apiKey}');
define('KPK4444_API_URL', 'https://${url ? url.trim() : ''}');

$userIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';

if (isset($_GET['kpk_unban']) && $_GET['kpk_unban'] === KPK4444_API_KEY) {
    if (isset($_GET['target_ip'])) {
        if ($_GET['target_ip'] === 'ALL') {
            array_map('unlink', glob(__DIR__ . '/kpk_banned_*.txt'));
        } else {
            @unlink(__DIR__ . '/kpk_banned_ip_' . md5($_GET['target_ip']) . '.txt');
            @unlink(__DIR__ . '/kpk_banned_user_' . md5($_GET['target_ip']) . '.txt');
        }
    }
    die("KPK4444: Threat ban cache cleared!");
}

$username = "unknown";
        if (isset($_COOKIE['OJSSID'])) {
            try {
                $configFile = __DIR__ . '/config.inc.php';
                if (file_exists($configFile)) {
                    $config = parse_ini_file($configFile, true);
                    if (isset($config['database']) && isset($config['database']['name'])) {
                        $db = $config['database'];
                        $driver = isset($db['driver']) ? strtolower($db['driver']) : 'mysql';
                        $host = !empty($db['host']) ? $db['host'] : 'localhost';
                        try {
                            $dsn = (strpos($driver, 'postgres') !== false || $driver === 'pgsql') ? "pgsql:host=$host;dbname={$db['name']}" : "mysql:host=$host;dbname={$db['name']}";
                            $pdo = new PDO($dsn, $db['username'], $db['password']);
                            $stmt = $pdo->prepare("SELECT user_id FROM sessions WHERE session_id = ?");
                            try { $stmt->execute([$_COOKIE['OJSSID']]); }
                            catch (Exception $e) {
                                $stmt = $pdo->prepare("SELECT user_id FROM sessions WHERE id = ?");
                                $stmt->execute([$_COOKIE['OJSSID']]);
                            }
                            $userId = $stmt->fetchColumn();
                            if ($userId) {
                                $stmt2 = $pdo->prepare("SELECT username FROM users WHERE user_id = ?");
                                try { $stmt2->execute([$userId]); }
                                catch (Exception $e) {
                                    $stmt2 = $pdo->prepare("SELECT username FROM users WHERE id = ?");
                                    $stmt2->execute([$userId]);
                                }
                                $found = $stmt2->fetchColumn();
                                if ($found) { $username = $found; }
                            }
                        } catch (Exception $e) {}
                    }
                }
            } catch (Exception $e) {}
        }
        
$ipCache = __DIR__ . '/kpk_banned_ip_' . md5($userIp??$_SERVER['REMOTE_ADDR']??'unknown') . '.txt';
$userCache = __DIR__ . '/kpk_banned_user_' . md5($username) . '.txt';

if (file_exists($ipCache) || ($username !== "unknown" && file_exists($userCache))) {
    $cFile = file_exists($ipCache) ? $ipCache : $userCache;
    if (time() - filemtime($cFile) < 3600) {
        setcookie('OJSSID', '', time() - 3600, '/');
        header('HTTP/1.1 403 Forbidden');
        $isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
        if ($isAjax) { die(json_encode(['error' => 'KPK4444 SHIELD: IP or Account Banned. Reloading...'])); }
        die(base64_decode("PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=="));
    } else { 
        @unlink($ipCache); 
        @unlink($userCache);
    }
}

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    $skipPaths = []; // Scan everything (login, register, upload)
    $shouldSkip = false;
    foreach ($skipPaths as $path) {
        if (stripos($uri, $path) !== false) {
            $shouldSkip = true;
            break;
        }
    }
    
    if (!$shouldSkip) {
        $c = "";
        
        $contentLen = isset($_SERVER['CONTENT_LENGTH']) ? (int)$_SERVER['CONTENT_LENGTH'] : 0;
        
        $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
        
        if ($contentLen > 2000000 && stripos($contentType, 'multipart/form-data') === false) {
        
            header('HTTP/1.1 413 Payload Too Large');
        
            die("KPK4444 SHIELD: Payload Too Large. RAM Crash Prevented.");
        
        }
        
        $rawInput = file_get_contents('php://input');
        
        if ($rawInput && strlen($rawInput) < 2000000) { $c .= $rawInput . " "; }
        
        $p = $_POST; foreach(['password','oldPassword','newPassword','password_repeat'] as $k) if(isset($p[$k])) $p[$k]='***';
        if (!empty($p)) { $c .= @json_encode($p, 1048576 | 512 | 256) . " "; }
        if (!empty($_GET)) { $c .= @json_encode($_GET, 1048576 | 512 | 256) . " "; }
        if (!empty($_FILES)) {
            foreach ($_FILES as $fileKey => $file) {
                if (isset($file['name'])) {
                    $c .= is_array($file['name']) ? json_encode($file['name']) . " " : $file['name'] . " ";
                }
                if (isset($file['tmp_name'])) {
                    $tmpNames = is_array($file['tmp_name']) ? $file['tmp_name'] : [$file['tmp_name']];
                    foreach ($tmpNames as $tmp) {
                        if (is_uploaded_file($tmp)) {
                            $fileContent = @file_get_contents($tmp, false, null, 0, 50000);
                            if ($fileContent) {
                                $c .= " [FILE_CONTENT:" . base64_encode($fileContent) . "] ";
                            }
                        }
                    }
                }
            }
        }
        $cleanContent = "";
        $len = strlen($c);
        for ($i = 0; $i < $len; $i++) {
            $ord = ord($c[$i]);
            if (($ord >= 32 && $ord <= 126) || $ord == 10 || $ord == 13 || $ord == 9) {
                $cleanContent .= $c[$i];
            }
        }
        $c = $cleanContent;
        
        
        $p = json_encode(['apiKey'=>KPK4444_API_KEY, 'domain'=>$_SERVER['HTTP_HOST']??'unknown', 'content'=>$c, 'field'=>'global', 'userIp'=>$userIp, 'username'=>$username]);
        if ($p) {
            $ch = curl_init(rtrim(KPK4444_API_URL, '/') . '/api/scan');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => $p,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-Forwarded-For: '.$userIp],
                CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 15,
                CURLOPT_FOLLOWLOCATION => true, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0
            ]);
            $res = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($code == 200 && strpos(str_replace(' ', '', $res), '"blocked":true') !== false) {
                if (count(glob(__DIR__ . '/kpk_banned_*.txt')) < 500) {
                    if (isset($username) && $username !== "unknown") {
                        file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time());
                    } else {
                        file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time());
                    }
                }
                header('HTTP/1.1 403 Forbidden');
                $isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);
                if ($isAjax) {
                    die("KPK4444 SHIELD: Access Denied.<script>window.top.location.href='https://www.google.com';</script><img src=x onerror=window.top.location.href=atob('aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbQ==')>");
                } else {
                    die(base64_decode("PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=="));
                }
            }
        }
    }
}

// Serve the request
require_once './lib/pkp/includes/bootstrap.php';
Application::get()->execute();

// Inject AJAX Interceptor after OJS finishes executing
$isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') || 
          strpos($_SERVER['REQUEST_URI'], '/api/') !== false || 
          (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);

if (!$isAjax) {
    echo '<script>!function(){var o=window.XMLHttpRequest.prototype.open;window.XMLHttpRequest.prototype.open=function(){this.addEventListener("readystatechange",function(){if(4===this.readyState&&(403===this.status||429===this.status)){document.write(atob("PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=="));setTimeout(function(){window.top.location.href="https://www.google.com"},1000)}});return o.apply(this,arguments)};var f=window.fetch;if(f){window.fetch=function(){return f.apply(this,arguments).then(function(r){if(403===r.status||429===r.status){document.write(atob("PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=="));setTimeout(function(){window.top.location.href="https://www.google.com"},1000)}return r})}}}();</script>';
}


// --- KPK4444 SHIELD SECURE FOOTER ---
// Protected by Kapuyuak Security System
`;

