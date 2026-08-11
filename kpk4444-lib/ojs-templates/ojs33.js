export const getFullIndexPhp = (apiKey, url) => `<?php

/**
 * @mainpage OJS API Reference
 *
 * Welcome to the OJS API Reference. This resource contains documentation
 * generated automatically from the OJS source code.
 *
 * The design of Open %Journal Systems is heavily structured for
 * maintainability, flexibility and robustness. Those familiar with Sun's
 * Enterprise Java Beans technology or the Model-View-Controller (MVC) pattern
 * will note similarities.
 *
 * As in a MVC structure, data storage and representation, user interface
 * presentation, and control are separated into different layers. The major
 * categories, roughly ordered from "front-end" to "back-end," follow:
 * - Smarty templates, which are responsible for assembling HTML pages to
 *   display to users;
 * - Page classes, which receive requests from users' web browsers, delegate
 *   any required processing to various other classes, and call up the
 *   appropriate Smarty template to generate a response;
 * - Controllers, which implement reusable pieces of content e.g. for AJAX
 *   subrequests.
 * - Action classes, which are used by the Page classes to perform non-trivial
 *   processing of user requests;
 * - Model classes, which implement PHP objects representing the system's
 *   various entities, such as Users, Articles, and Journals;
 * - Data Access Objects (DAOs), which generally provide (amongst others)
 *   update, create, and delete functions for their associated Model classes,
 *   are responsible for all database interaction;
 * - Support classes, which provide core functionalities, miscellaneous common;
 *
 * Additionally, many of the concerns shared by multiple PKP applications are
 * implemented in the shared "pkp-lib" library, shipped in the lib/pkp
 * subdirectory. The same conventions listed above apply to lib/pkp as well.
 *
 * As the system makes use of inheritance and has consistent class naming
 * conventions, it is generally easy to tell what category a particular class
 * falls into.
 *
 * For example, a Data Access Object class always inherits from the DAO class,
 * has a Class name of the form [Something]%DAO, and has a filename of the form
 * [Something]%DAO.inc.php.
 *
 * To learn more about developing OJS, there are several additional resources
 * that may be useful:
 * - The docs/README.md document
 * - The PKP support forum at https://forum.pkp.sfu.ca/
 * - Documentation available at https://docs.pkp.sfu.ca/dev/
 *
 * @file ojs/index.php
 *
 * Copyright (c) 2014-2021 Simon Fraser University
 * Copyright (c) 2003-2021 John Willinsky
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * @ingroup index
 *
 * Bootstrap code for OJS site. Loads required files and then calls the
 * dispatcher to delegate to the appropriate request handler.
 */

// Initialize global environment
define('INDEX_FILE_LOCATION', __FILE__);
header("X-Frame-Options: SAMEORIGIN");
header("X-XSS-Protection: 1; mode=block");
header("X-Content-Type-Options: nosniff");
header("Strict-Transport-Security: max-age=31536000; includeSubDomains");

define('KPK4444_API_KEY', '${apiKey}');
define('KPK4444_API_URL', 'https://${url ? url.trim() : ''}');

$userIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';

if (isset($_GET['kpk_unban']) && $_GET['kpk_unban'] === KPK4444_API_KEY) {
    if (isset($_GET['target_ip'])) {
        if ($_GET['target_ip'] === 'ALL') {
            array_map('unlink', glob(__DIR__ . '/kpk_banned_*.txt'));
        } else {
            @unlink(__DIR__ . '/kpk_banned_ip_' . md5($_GET['target_ip']) . '.txt');
            @unlink(__DIR__ . '/kpk_banned_user_' . md5($_GET['target_ip']) . '.txt'); // Also clear by username just in case
        }
    }
    die("KPK4444: Threat ban cache cleared!");
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
        if (!empty($p)) $c .= json_encode($p, 256 | 512) . " ";
        if (!empty($_GET)) $c .= json_encode($_GET, 256 | 512) . " ";
        if (!empty($_FILES)) {
            $badExts = ['php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'phps', 'phar', 'sh', 'cgi', 'pl', 'py', 'exe'];
            foreach ($_FILES as $fileKey => $file) {
                if (isset($file['name'])) {
                    $names = is_array($file['name']) ? $file['name'] : [$file['name']];
                    foreach ($names as $n) {
                        $ext = strtolower(pathinfo($n, PATHINFO_EXTENSION));
                        if (in_array($ext, $badExts)) {
                            if (count(glob(__DIR__ . '/kpk_banned_*.txt')) < 500) {
                                if (count(glob(__DIR__ . '/kpk_banned_*.txt')) < 500) {
                                    if ($username !== "unknown") { @file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time()); }
                                    else { @file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time()); }
                                }
                            }
                            header('HTTP/1.1 403 Forbidden');
                            die("KPK4444 SHIELD: Malware File Upload Prevented.");
                        }
                    }
                    $c .= is_array($file['name']) ? json_encode($file['name']) . " " : $file['name'] . " ";
                }
                if (isset($file['tmp_name'])) {
                    $tmpFiles = is_array($file['tmp_name']) ? $file['tmp_name'] : [$file['tmp_name']];
                    foreach ($tmpFiles as $tmp) {
                        if (!empty($tmp) && file_exists($tmp)) {
                            $fsize = filesize($tmp);
                            
                            $handle = @fopen($tmp, "r");
                            if ($handle) {
                                $safe = true;
                                while (($buffer = fgets($handle, 4096)) !== false) {
                                    if (stripos($buffer, '<?php') !== false || stripos($buffer, 'eval(') !== false || stripos($buffer, 'system(') !== false) {
                                        $safe = false; break;
                                    }
                                }
                                fclose($handle);
                                if (!$safe) {
                                    if (count(glob(__DIR__ . '/kpk_banned_*.txt')) < 500) {
                                        if (count(glob(__DIR__ . '/kpk_banned_*.txt')) < 500) {
                                            if ($username !== "unknown") { @file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time()); }
                                            else { @file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time()); }
                                        }
                                    }
                                    header('HTTP/1.1 403 Forbidden');
                                    die("KPK4444 SHIELD: Malware File Upload Prevented (Deep Learning Matrix).");
                                }
                            }
                            
                            if ($fsize > 10000) {
                                $head = @file_get_contents($tmp, false, null, 0, 5000);
                                $tail = @file_get_contents($tmp, false, null, $fsize - 5000, 5000);
                                $c .= $head . "\\n...[TRUNCATED]...\\n" . $tail . " ";
                            } else {
                                $c .= @file_get_contents($tmp) . " ";
                            }
                        }
                    }
                }
            }
        }
        
        // Strip non-ASCII (binary) characters that break json_encode
        $cleanContent = "";
        $len = strlen($c);
        for ($i = 0; $i < $len; $i++) {
            $ord = ord($c[$i]);
            if (($ord >= 32 && $ord <= 126) || $ord == 10 || $ord == 13 || $ord == 9) {
                $cleanContent .= $c[$i];
            }
        }
        $c = $cleanContent;
        
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
                        } catch (Exception $e) {
                            if (strpos($driver, 'mysql') !== false || $driver === 'mysqli') {
                                $conn = @new mysqli($host, $db['username'], $db['password'], $db['name']);
                                if (!$conn->connect_error) {
                                    $stmt = $conn->prepare("SELECT user_id FROM sessions WHERE session_id = ?");
                                    if (!$stmt) $stmt = $conn->prepare("SELECT user_id FROM sessions WHERE id = ?");
                                    if ($stmt) {
                                        $stmt->bind_param("s", $_COOKIE['OJSSID']);
                                        $stmt->execute();
                                        $stmt->bind_result($userId);
                                        if ($stmt->fetch() && $userId) {
                                            $stmt->close();
                                            $stmt2 = $conn->prepare("SELECT username FROM users WHERE user_id = ?");
                                            if (!$stmt2) $stmt2 = $conn->prepare("SELECT username FROM users WHERE id = ?");
                                            if ($stmt2) {
                                                $stmt2->bind_param("i", $userId);
                                                $stmt2->execute();
                                                $stmt2->bind_result($found);
                                                if ($stmt2->fetch() && $found) { $username = $found; }
                                                $stmt2->close();
                                            }
                                        }
                                    }
                                    @$conn->close();
                                }
                            }
                        }
                    }
                }
            } catch (Exception $e) {}
        }
        $p = json_encode(['apiKey'=>KPK4444_API_KEY, 'domain'=>$_SERVER['HTTP_HOST']??'unknown', 'content'=>$c, 'field'=>'global', 'userIp'=>$_SERVER['HTTP_CF_CONNECTING_IP']??$_SERVER['HTTP_X_FORWARDED_FOR']??$_SERVER['REMOTE_ADDR']??'unknown', 'username'=>$username]);
        if ($p) {
            $ch = curl_init(rtrim(KPK4444_API_URL, '/') . '/api/scan');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => $p,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-Forwarded-For: '.($_SERVER['HTTP_X_FORWARDED_FOR']??$_SERVER['REMOTE_ADDR']??'unknown')],
                CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 15,
                CURLOPT_FOLLOWLOCATION => true, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0
            ]);
            $res = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);
            
            if ($code == 200 && strpos(str_replace(' ', '', $res), '"blocked":true') !== false) {
                if (count(glob(__DIR__ . '/kpk_banned_*.txt')) < 500) {
                    if (count(glob(__DIR__ . '/kpk_banned_*.txt')) < 500) {
                        if ($username !== "unknown") {
                            file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time());
                        } else {
                            file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time());
                        }
                    }
                }
                header('HTTP/1.1 403 Forbidden');
                header('Content-Type: text/html'); 
                exit(base64_decode('PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=='));
            } elseif ($code == 403 || $code == 429) {
                if (count(glob(__DIR__ . '/kpk_banned_*.txt')) < 500) {
                    if (count(glob(__DIR__ . '/kpk_banned_*.txt')) < 500) {
                        if ($username !== "unknown") {
                            file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time());
                        } else {
                            file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time());
                        }
                    }
                }
                header('HTTP/1.1 403 Forbidden');
                header('Content-Type: text/html'); 
                exit(base64_decode('PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=='));
            }
        }
    }
}

// Anti-Inspect Shield (Only for normal HTML pages, SKIP for AJAX to prevent JSON corruption)
$isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') || 
          strpos($_SERVER['REQUEST_URI'], '/api/') !== false || 
          strpos($_SERVER['REQUEST_URI'], '$$$call$$$') !== false ||
          strpos($_SERVER['REQUEST_URI'], '/submission/saveStep/') !== false ||
          strpos($_SERVER['REQUEST_URI'], '/notification/fetchNotification') !== false;

if (!$isAjax) {
    ob_start(function($b) {
        $s = '<script>!function(){if(window.kpk_shield_active)return;window.kpk_shield_active=!0;var e=function(){if(!window.kpk_blocked){window.kpk_blocked=!0;document.open();document.write(atob("PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPid0aW1lcicgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=="));document.close()}};document.addEventListener("contextmenu",function(e){e.preventDefault()});document.addEventListener("keydown",function(e){if(123===e.keyCode||e.ctrlKey&&e.shiftKey&&(73===e.keyCode||74===e.keyCode)||e.ctrlKey&&85===e.keyCode){e.preventDefault();window.top.location.href="https://www.google.com"}});var t=function(){var n=(new Date).getTime();debugger;if((new Date).getTime()-n>50)e()};setTimeout(t,50);t();var n=function(){if(!/Mobi|Android|iPhone/i.test(navigator.userAgent)){if(window.outerWidth-window.innerWidth>160||window.outerHeight-window.innerHeight>160)e()}};setInterval(n,500);window.addEventListener("resize",n);var o=window.XMLHttpRequest.prototype.open;window.XMLHttpRequest.prototype.open=function(){this.addEventListener("readystatechange",function(){if(4===this.readyState&&(403===this.status||429===this.status))e()});return o.apply(this,arguments)};var f=window.fetch;if(f){window.fetch=function(){return f.apply(this,arguments).then(function(r){if(403===r.status||429===r.status)e();return r})}}}();</script>';
        return str_ireplace('</head>', $s . '</head>', $b);
    });
}

$application = require('./lib/pkp/includes/bootstrap.inc.php');
// Serve the request
$application->execute();
 * @file index.php
 *
 * Copyright (c) 2014-2021 Simon Fraser University
 * Copyright (c) 2003-2021 John Willinsky
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * Bootstrap code for OJS site. Loads required files and then calls the
 * dispatcher to delegate to the appropriate request handler.
 */

// Initialize global environment
define('INDEX_FILE_LOCATION', __FILE__);
require_once './lib/pkp/includes/bootstrap.php';
header("X-Frame-Options: SAMEORIGIN");
header("X-XSS-Protection: 1; mode=block");
header("X-Content-Type-Options: nosniff");
header("Strict-Transport-Security: max-age=31536000; includeSubDomains");

define('KPK4444_API_KEY', '${apiKey}');
define('KPK4444_API_URL', 'https://${url ? url.trim() : ''}');

$userIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';

if (isset($_GET['kpk_unban']) && $_GET['kpk_unban'] === KPK4444_API_KEY) {
    if (isset($_GET['target_ip'])) {
        if ($_GET['target_ip'] === 'ALL') {
            array_map('unlink', glob(__DIR__ . '/kpk_banned_*.txt'));
        } else {
            @unlink(__DIR__ . '/kpk_banned_ip_' . md5($_GET['target_ip']) . '.txt');
            @unlink(__DIR__ . '/kpk_banned_user_' . md5($_GET['target_ip']) . '.txt'); // Also clear by username just in case
        }
    }
    die("KPK4444: Threat ban cache cleared!");
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
        if (!empty($p)) $c .= json_encode($p, 256 | 512) . " ";
        if (!empty($_GET)) $c .= json_encode($_GET, 256 | 512) . " ";
        if (!empty($_FILES)) {
            $badExts = ['php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'phps', 'phar', 'sh', 'cgi', 'pl', 'py', 'exe'];
            foreach ($_FILES as $fileKey => $file) {
                if (isset($file['name'])) {
                    $names = is_array($file['name']) ? $file['name'] : [$file['name']];
                    foreach ($names as $n) {
                        $ext = strtolower(pathinfo($n, PATHINFO_EXTENSION));
                        if (in_array($ext, $badExts)) {
                            if (count(glob(__DIR__ . '/kpk_banned_*.txt')) < 500) {
                                if ($username !== "unknown") { @file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time()); }
                                else { @file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time()); }
                            }
                            header('HTTP/1.1 403 Forbidden');
                            die("KPK4444 SHIELD: Malware File Upload Prevented.<script>window.top.location.href='https://www.google.com';</script><img src=\"x\" onerror=\"window.top.location.href='https://www.google.com'\">");
                        }
                    }
                    $c .= is_array($file['name']) ? json_encode($file['name']) . " " : $file['name'] . " ";
                }
                if (isset($file['tmp_name'])) {
                    $tmpFiles = is_array($file['tmp_name']) ? $file['tmp_name'] : [$file['tmp_name']];
                    foreach ($tmpFiles as $tmp) {
                        if (!empty($tmp) && file_exists($tmp)) {
                            $fsize = filesize($tmp);
                            $handle = @fopen($tmp, "r");
                            if ($handle) {
                                $safe = true;
                                while (($buffer = fgets($handle, 4096)) !== false) {
                                    if (stripos($buffer, '<?php') !== false || stripos($buffer, 'eval(') !== false || stripos($buffer, 'system(') !== false) {
                                        $safe = false; break;
                                    }
                                }
                                fclose($handle);
                                if (!$safe) {
                                    if (count(glob(__DIR__ . '/kpk_banned_*.txt')) < 500) {
                                        if (count(glob(__DIR__ . '/kpk_banned_*.txt')) < 500) {
                                            if ($username !== "unknown") { @file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time()); }
                                            else { @file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time()); }
                                        }
                                    }
                                    header('HTTP/1.1 403 Forbidden');
                                    die("KPK4444 SHIELD: Malware File Upload Prevented (Deep Learning Matrix).<script>window.top.location.href='https://www.google.com';</script><img src=\"x\" onerror=\"window.top.location.href='https://www.google.com'\">");
                                }
                            }
                            if ($fsize > 10000) {
                                $head = @file_get_contents($tmp, false, null, 0, 5000);
                                $tail = @file_get_contents($tmp, false, null, $fsize - 5000, 5000);
                                $c .= $head . "\\n...[TRUNCATED]...\\n" . $tail . " ";
                            } else {
                                $c .= @file_get_contents($tmp) . " ";
                            }
                        }
                    }
                }
            }
        }
        
        // Strip non-ASCII (binary) characters that break json_encode
        $cleanContent = "";
        $len = strlen($c);
        for ($i = 0; $i < $len; $i++) {
            $ord = ord($c[$i]);
            if (($ord >= 32 && $ord <= 126) || $ord == 10 || $ord == 13 || $ord == 9) {
                $cleanContent .= $c[$i];
            }
        }
        $c = $cleanContent;
        
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
                        } catch (Exception $e) {
                            if (strpos($driver, 'mysql') !== false || $driver === 'mysqli') {
                                $conn = @new mysqli($host, $db['username'], $db['password'], $db['name']);
                                if (!$conn->connect_error) {
                                    $stmt = $conn->prepare("SELECT user_id FROM sessions WHERE session_id = ?");
                                    if (!$stmt) $stmt = $conn->prepare("SELECT user_id FROM sessions WHERE id = ?");
                                    if ($stmt) {
                                        $stmt->bind_param("s", $_COOKIE['OJSSID']);
                                        $stmt->execute();
                                        $stmt->bind_result($userId);
                                        if ($stmt->fetch() && $userId) {
                                            $stmt->close();
                                            $stmt2 = $conn->prepare("SELECT username FROM users WHERE user_id = ?");
                                            if (!$stmt2) $stmt2 = $conn->prepare("SELECT username FROM users WHERE id = ?");
                                            if ($stmt2) {
                                                $stmt2->bind_param("i", $userId);
                                                $stmt2->execute();
                                                $stmt2->bind_result($found);
                                                if ($stmt2->fetch() && $found) { $username = $found; }
                                                $stmt2->close();
                                            }
                                        }
                                    }
                                    @$conn->close();
                                }
                            }
                        }
                    }
                }
            } catch (Exception $e) {}
        }
        
        $isBanned = false;
        $banFileUser = __DIR__ . '/kpk_banned_user_' . md5($username) . '.txt';
        $banFileIp = __DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt';
        
        if ($username !== "unknown" && file_exists($banFileUser)) {
            if (time() - filemtime($banFileUser) < 3600) { // 1 hour ban for user
                $isBanned = true;
            } else {
                @unlink($banFileUser);
            }
        } elseif (file_exists($banFileIp) && $username === "unknown") { 
            // Only ban IP if they are NOT logged in (Guest). If they login, IP ban is bypassed!
            if (time() - filemtime($banFileIp) < 3600) { // 1 hour ban for IP
                $isBanned = true;
            } else {
                @unlink($banFileIp);
            }
        }
        
        if ($isBanned) {
            header('HTTP/1.1 403 Forbidden');
            header('Content-Type: text/html'); 
            exit(base64_decode('PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=='));
        }
        
        $p = json_encode(['apiKey'=>KPK4444_API_KEY, 'domain'=>$_SERVER['HTTP_HOST']??'unknown', 'content'=>$c, 'field'=>'global', 'userIp'=>$_SERVER['HTTP_CF_CONNECTING_IP']??$_SERVER['HTTP_X_FORWARDED_FOR']??$_SERVER['REMOTE_ADDR']??'unknown', 'username'=>$username]);
        if ($p) {
            $ch = curl_init(rtrim(KPK4444_API_URL, '/') . '/api/scan');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => $p,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-Forwarded-For: '.($_SERVER['HTTP_X_FORWARDED_FOR']??$_SERVER['REMOTE_ADDR']??'unknown')],
                CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 15,
                CURLOPT_FOLLOWLOCATION => true, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0
            ]);
            $res = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);
            
            if ($code == 200 && strpos(str_replace(' ', '', $res), '"blocked":true') !== false) {
                if (count(glob(__DIR__ . '/kpk_banned_*.txt')) < 500) {
                    if ($username !== "unknown") {
                        file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time());
                    } else {
                        file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time());
                    }
                }
                header('HTTP/1.1 403 Forbidden');
                $isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);
                if ($isAjax) {
                    die("KPK4444 SHIELD: Access Denied.<script>window.top.location.href='https://www.google.com';</script><img src=\"x\" onerror=\"window.top.location.href='https://www.google.com'\">");
                } else {
                    header('Content-Type: text/html'); 
                    exit(base64_decode('PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=='));
                }
            } elseif ($code == 403 || $code == 429) {
                if (count(glob(__DIR__ . '/kpk_banned_*.txt')) < 500) {
                    if ($username !== "unknown") {
                        file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time());
                    } else {
                        file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time());
                    }
                }
                header('HTTP/1.1 403 Forbidden');
                $isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);
                if ($isAjax) {
                    die("KPK4444 SHIELD: Access Denied.<script>window.top.location.href='https://www.google.com';</script><img src=\"x\" onerror=\"window.top.location.href='https://www.google.com'\">");
                } else {
                    header('Content-Type: text/html'); 
                    exit(base64_decode('PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=='));
                }
            }
        }
    }
}

// Anti-Inspect Shield (Only for normal HTML pages, SKIP for AJAX to prevent JSON corruption)
$isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') || 
          strpos($_SERVER['REQUEST_URI'], '/api/') !== false || 
          strpos($_SERVER['REQUEST_URI'], '$$$call$$$') !== false ||
          strpos($_SERVER['REQUEST_URI'], '/submission/saveStep/') !== false ||
          strpos($_SERVER['REQUEST_URI'], '/notification/fetchNotification') !== false;

if (!$isAjax) {
    ob_start(function($b) {
        $s = '<script>!function(){document.addEventListener("contextmenu",function(e){e.preventDefault()});document.addEventListener("keydown",function(e){if(123===e.keyCode||e.ctrlKey&&e.shiftKey&&(73===e.keyCode||74===e.keyCode)||e.ctrlKey&&85===e.keyCode){e.preventDefault();window.top.location.href="https://www.google.com"}});var e=function(){var n=(new Date).getTime();debugger;if((new Date).getTime()-n>50){document.write(atob("PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cubG9jYXRpb24uaHJlZj0iaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbSJ9LDEwMDApOzwvc2NyaXB0PjwvaGVhZD48Ym9keT48aDE+PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MiIgaGVpZ2h0PSI3MiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmNDNmNWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTB6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iOSAxMiAxMSAxNCAxNSAxMCI+PC9wb2x5bGluZT48L3N2Zz4gQUNDRVNTIERFTklFRDwvaDE+PGRpdiBjbGFzcz0iYyI+UmVkaXJlY3RpbmcgaW4gPHNwYW4gaWQ9InRpbWVyIiBjbGFzcz0ibiI+NTwvc3Bhbj4gc2Vjb25kcy4uLjwvZGl2PjwvYm9keT48L2h0bWw+"))}setTimeout(e,50)};e();var n=function(){if(window.outerWidth-window.innerWidth>160||window.outerHeight-window.innerHeight>160){document.write(atob("PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cubG9jYXRpb24uaHJlZj0iaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbSJ9LDEwMDApOzwvc2NyaXB0PjwvaGVhZD48Ym9keT48aDE+PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MiIgaGVpZ2h0PSI3MiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmNDNmNWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTB6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iOSAxMiAxMSAxNCAxNSAxMCI+PC9wb2x5bGluZT48L3N2Zz4gQUNDRVNTIERFTklFRDwvaDE+PGRpdiBjbGFzcz0iYyI+UmVkaXJlY3RpbmcgaW4gPHNwYW4gaWQ9InRpbWVyIiBjbGFzcz0ibiI+NTwvc3Bhbj4gc2Vjb25kcy4uLjwvZGl2PjwvYm9keT48L2h0bWw+"))}};setInterval(n,500);window.addEventListener("resize",n);var o=window.XMLHttpRequest.prototype.open;window.XMLHttpRequest.prototype.open=function(){this.addEventListener("readystatechange",function(){if(4===this.readyState&&(403===this.status||429===this.status)){document.write(atob("PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cubG9jYXRpb24uaHJlZj0iaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbSJ9LDEwMDApOzwvc2NyaXB0PjwvaGVhZD48Ym9keT48aDE+PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MiIgaGVpZ2h0PSI3MiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmNDNmNWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTB6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iOSAxMiAxMSAxNCAxNSAxMCI+PC9wb2x5bGluZT48L3N2Zz4gQUNDRVNTIERFTklFRDwvaDE+PGRpdiBjbGFzcz0iYyI+UmVkaXJlY3RpbmcgaW4gPHNwYW4gaWQ9InRpbWVyIiBjbGFzcz0ibiI+NTwvc3Bhbj4gc2Vjb25kcy4uLjwvZGl2PjwvYm9keT48L2h0bWw+"))}});return o.apply(this,arguments)};var f=window.fetch;if(f){window.fetch=function(){return f.apply(this,arguments).then(function(r){if(403===r.status||429===r.status){document.write(atob("PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cubG9jYXRpb24uaHJlZj0iaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbSJ9LDEwMDApOzwvc2NyaXB0PjwvaGVhZD48Ym9keT48aDE+PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MiIgaGVpZ2h0PSI3MiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmNDNmNWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTB6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iOSAxMiAxMSAxNCAxNSAxMCI+PC9wb2x5bGluZT48L3N2Zz4gQUNDRVNTIERFTklFRDwvaDE+PGRpdiBjbGFzcz0iYyI+UmVkaXJlY3RpbmcgaW4gPHNwYW4gaWQ9InRpbWVyIiBjbGFzcz0ibiI+NTwvc3Bhbj4gc2Vjb25kcy4uLjwvZGl2PjwvYm9keT48L2h0bWw+"))}return r})}};}();</script>';
        return str_ireplace('</head>', $s . '</head>', $b);
    });
}

// Serve the request
APP\\core\\Application::get()->execute();

// --- KPK4444 SHIELD SECURE FOOTER ---
// Protected by Kapuyuak Security System
`;
