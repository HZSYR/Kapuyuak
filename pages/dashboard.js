import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import Globe3D from '../components/Globe3D';

const getFullIndexPhp = (apiKey, url) => `<?php

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

define('KPK4444_API_KEY', '${apiKey}');
define('KPK4444_API_URL', 'https://${url ? url.trim() : ''}');

$userIp = $_SERVER['HTTP_CF_CONNECTING_IP']??$_SERVER['HTTP_X_FORWARDED_FOR']??$_SERVER['REMOTE_ADDR']??'unknown';

if (isset($_GET['kpk_unban']) && $_GET['kpk_unban'] === KPK4444_API_KEY) {
    if (isset($_GET['target_ip'])) {
        if ($_GET['target_ip'] === 'ALL') {
            array_map('unlink', glob(__DIR__ . '/kpk_banned_*.txt'));
        } else {
            @unlink(__DIR__ . '/kpk_banned_ip_' . md5($_GET['target_ip']) . '.txt');
            @unlink(__DIR__ . '/kpk_banned_user_' . md5($_GET['target_ip']) . '.txt'); // Also clear by username just in case
        }
    }
    die("KPK4444: Local ban cache cleared!");
}

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    $skipPaths = ['/login', '/signIn', '/signOut', '/user/register', '/user/profile'];
    $shouldSkip = false;
    foreach ($skipPaths as $path) {
        if (stripos($uri, $path) !== false) {
            $shouldSkip = true;
            break;
        }
    }
    
    if (!$shouldSkip) {
        $c = "";
        
        $rawInput = file_get_contents('php://input');
        if ($rawInput) { $c .= $rawInput . " "; }
        
        if (!empty($_POST)) $c .= json_encode($_POST, 256 | 512) . " ";
        if (!empty($_GET)) $c .= json_encode($_GET, 256 | 512) . " ";
        if (!empty($_FILES)) {
            foreach ($_FILES as $fileKey => $file) {
                if (isset($file['name'])) {
                    $c .= is_array($file['name']) ? json_encode($file['name']) . " " : $file['name'] . " ";
                }
                if (isset($file['tmp_name'])) {
                    $tmpFiles = is_array($file['tmp_name']) ? $file['tmp_name'] : [$file['tmp_name']];
                    foreach ($tmpFiles as $tmp) {
                        if (!empty($tmp) && file_exists($tmp)) {
                            $fsize = filesize($tmp);
                            if ($fsize > 10000) {
                                $head = file_get_contents($tmp, false, null, 0, 5000);
                                $tail = file_get_contents($tmp, false, null, $fsize - 5000, 5000);
                                $c .= $head . "\\n...[TRUNCATED]...\\n" . $tail . " ";
                            } else {
                                $c .= file_get_contents($tmp) . " ";
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
            $ch = curl_init(KPK4444_API_URL . '/api/scan');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => $p,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-Forwarded-For: '.($_SERVER['HTTP_X_FORWARDED_FOR']??$_SERVER['REMOTE_ADDR']??'unknown')],
                CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 15,
                CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => false
            ]);
            $res = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);
            
            if ($code == 200 && strpos(str_replace(' ', '', $res), '"blocked":true') !== false) {
                if ($username !== "unknown") {
                    file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time());
                } else {
                    file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time());
                }
                header('HTTP/1.1 403 Forbidden');
                header('Content-Type: text/html'); 
                exit(base64_decode('PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=='));
            } elseif ($code == 403 || $code == 429) {
                if ($username !== "unknown") {
                    file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time());
                } else {
                    file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time());
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
        $s = '<script>!function(){if(window.kpk_shield_active)return;window.kpk_shield_active=!0;var e=function(){if(!window.kpk_blocked){window.kpk_blocked=!0;document.open();document.write(atob("PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=="));document.close()}};document.addEventListener("contextmenu",function(e){e.preventDefault()});document.addEventListener("keydown",function(e){if(123===e.keyCode||e.ctrlKey&&e.shiftKey&&(73===e.keyCode||74===e.keyCode)||e.ctrlKey&&85===e.keyCode){e.preventDefault();window.top.location.href="https://www.google.com"}});var t=function(){var n=(new Date).getTime();debugger;if((new Date).getTime()-n>50)e()};setTimeout(t,50);t();var n=function(){if(!/Mobi|Android|iPhone/i.test(navigator.userAgent)){if(window.outerWidth-window.innerWidth>160||window.outerHeight-window.innerHeight>160)e()}};setInterval(n,500);window.addEventListener("resize",n);var o=window.XMLHttpRequest.prototype.open;window.XMLHttpRequest.prototype.open=function(){this.addEventListener("readystatechange",function(){if(4===this.readyState&&(403===this.status||429===this.status))e()});return o.apply(this,arguments)};var f=window.fetch;if(f){window.fetch=function(){return f.apply(this,arguments).then(function(r){if(403===r.status||429===r.status)e();return r})}}}();</script>';
        return str_ireplace('</head>', $s . '</head>', $b);
    });
}

$application = require('./lib/pkp/includes/bootstrap.inc.php');
$application->execute();
`;

const getFullIndexPhp34 = (apiKey, url) => `<?php

/**
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

define('KPK4444_API_KEY', '${apiKey}');
define('KPK4444_API_URL', 'https://${url ? url.trim() : ''}');

$userIp = $_SERVER['HTTP_CF_CONNECTING_IP']??$_SERVER['HTTP_X_FORWARDED_FOR']??$_SERVER['REMOTE_ADDR']??'unknown';

if (isset($_GET['kpk_unban']) && $_GET['kpk_unban'] === KPK4444_API_KEY) {
    if (isset($_GET['target_ip'])) {
        if ($_GET['target_ip'] === 'ALL') {
            array_map('unlink', glob(__DIR__ . '/kpk_banned_*.txt'));
        } else {
            @unlink(__DIR__ . '/kpk_banned_ip_' . md5($_GET['target_ip']) . '.txt');
            @unlink(__DIR__ . '/kpk_banned_user_' . md5($_GET['target_ip']) . '.txt'); // Also clear by username just in case
        }
    }
    die("KPK4444: Local ban cache cleared!");
}

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    $skipPaths = ['/login', '/signIn', '/signOut', '/user/register', '/user/profile'];
    $shouldSkip = false;
    foreach ($skipPaths as $path) {
        if (stripos($uri, $path) !== false) {
            $shouldSkip = true;
            break;
        }
    }
    
    if (!$shouldSkip) {
        $c = "";
        
        $rawInput = file_get_contents('php://input');
        if ($rawInput) { $c .= $rawInput . " "; }
        
        if (!empty($_POST)) $c .= json_encode($_POST, 256 | 512) . " ";
        if (!empty($_GET)) $c .= json_encode($_GET, 256 | 512) . " ";
        if (!empty($_FILES)) {
            foreach ($_FILES as $fileKey => $file) {
                if (isset($file['name'])) {
                    $c .= is_array($file['name']) ? json_encode($file['name']) . " " : $file['name'] . " ";
                }
                if (isset($file['tmp_name'])) {
                    $tmpFiles = is_array($file['tmp_name']) ? $file['tmp_name'] : [$file['tmp_name']];
                    foreach ($tmpFiles as $tmp) {
                        if (!empty($tmp) && file_exists($tmp)) {
                            $fsize = filesize($tmp);
                            if ($fsize > 10000) {
                                $head = file_get_contents($tmp, false, null, 0, 5000);
                                $tail = file_get_contents($tmp, false, null, $fsize - 5000, 5000);
                                $c .= $head . "\\n...[TRUNCATED]...\\n" . $tail . " ";
                            } else {
                                $c .= file_get_contents($tmp) . " ";
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
            if (time() - filemtime($banFileUser) < 86400) { // 24 hours ban for user
                $isBanned = true;
            } else {
                @unlink($banFileUser);
            }
        } elseif (file_exists($banFileIp) && $username === "unknown") { 
            // Only ban IP if they are NOT logged in (Guest). If they login, IP ban is bypassed!
            if (time() - filemtime($banFileIp) < 86400) { // 24 hours ban for IP
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
            $ch = curl_init(KPK4444_API_URL . '/api/scan');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => $p,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-Forwarded-For: '.($_SERVER['HTTP_X_FORWARDED_FOR']??$_SERVER['REMOTE_ADDR']??'unknown')],
                CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 15,
                CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => false
            ]);
            $res = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);
            
            if ($code == 200 && strpos(str_replace(' ', '', $res), '"blocked":true') !== false) {
                if ($username !== "unknown") {
                    file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time());
                } else {
                    file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time());
                }
                header('HTTP/1.1 403 Forbidden');
                header('Content-Type: text/html'); 
                exit(base64_decode('PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=='));
            } elseif ($code == 403 || $code == 429) {
                if ($username !== "unknown") {
                    file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time());
                } else {
                    file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time());
                }
                header('HTTP/1.1 403 Forbidden');
                header('Content-Type: text/html'); 
                exit(base64_decode('PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cubG9jYXRpb24uaHJlZj0iaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbSJ9LDEwMDApOzwvc2NyaXB0PjwvaGVhZD48Ym9keT48aDE+PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MiIgaGVpZ2h0PSI3MiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmNDNmNWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTB6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iOSAxMiAxMSAxNCAxNSAxMCI+PC9wb2x5bGluZT48L3N2Zz4gQUNDRVNTIERFTklFRDwvaDE+PGRpdiBjbGFzcz0iYyI+UmVkaXJlY3RpbmcgaW4gPHNwYW4gaWQ9InRpbWVyIiBjbGFzcz0ibiI+NTwvc3Bhbj4gc2Vjb25kcy4uLjwvZGl2PjwvYm9keT48L2h0bWw+'))
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
`;

const getFullIndexPhp35 = (apiKey, url) => `<?php

/**
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

define('KPK4444_API_KEY', '\${apiKey}');
define('KPK4444_API_URL', 'https://\${url ? url.trim() : ''}');

$userIp = $_SERVER['HTTP_CF_CONNECTING_IP']??$_SERVER['HTTP_X_FORWARDED_FOR']??$_SERVER['REMOTE_ADDR']??'unknown';

if (isset($_GET['kpk_unban']) && $_GET['kpk_unban'] === KPK4444_API_KEY) {
    if (isset($_GET['target_ip'])) {
        if ($_GET['target_ip'] === 'ALL') {
            array_map('unlink', glob(__DIR__ . '/kpk_banned_*.txt'));
        } else {
            @unlink(__DIR__ . '/kpk_banned_ip_' . md5($_GET['target_ip']) . '.txt');
            @unlink(__DIR__ . '/kpk_banned_user_' . md5($_GET['target_ip']) . '.txt'); // Also clear by username just in case
        }
    }
    die("KPK4444: Local ban cache cleared!");
}

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    $skipPaths = ['/login', '/signIn', '/signOut', '/user/register', '/user/profile'];
    $shouldSkip = false;
    foreach ($skipPaths as $path) {
        if (stripos($uri, $path) !== false) {
            $shouldSkip = true;
            break;
        }
    }
    
    if (!$shouldSkip) {
        $c = "";
        
        $rawInput = file_get_contents('php://input');
        if ($rawInput) { $c .= $rawInput . " "; }
        
        if (!empty($_POST)) $c .= json_encode($_POST, 256 | 512) . " ";
        if (!empty($_GET)) $c .= json_encode($_GET, 256 | 512) . " ";
        if (!empty($_FILES)) {
            foreach ($_FILES as $fileKey => $file) {
                if (isset($file['name'])) {
                    $c .= is_array($file['name']) ? json_encode($file['name']) . " " : $file['name'] . " ";
                }
                if (isset($file['tmp_name'])) {
                    $tmpFiles = is_array($file['tmp_name']) ? $file['tmp_name'] : [$file['tmp_name']];
                    foreach ($tmpFiles as $tmp) {
                        if (!empty($tmp) && file_exists($tmp)) {
                            $fsize = filesize($tmp);
                            if ($fsize > 10000) {
                                $head = file_get_contents($tmp, false, null, 0, 5000);
                                $tail = file_get_contents($tmp, false, null, $fsize - 5000, 5000);
                                $c .= $head . "\\\\n...[TRUNCATED]...\\\\n" . $tail . " ";
                            } else {
                                $c .= file_get_contents($tmp) . " ";
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
                            $stmt = $pdo->prepare("SELECT user_id FROM sessions WHERE id = ?");
                            try { $stmt->execute([$_COOKIE['OJSSID']]); } 
                            catch (Exception $e) { }
                            $userId = $stmt->fetchColumn();
                            if ($userId) {
                                $stmt2 = $pdo->prepare("SELECT username FROM users WHERE user_id = ?");
                                try { $stmt2->execute([$userId]); }
                                catch (Exception $e) { }
                                $found = $stmt2->fetchColumn();
                                if ($found) { $username = $found; }
                            }
                        } catch (Exception $e) {
                            if (strpos($driver, 'mysql') !== false || $driver === 'mysqli') {
                                $conn = @new mysqli($host, $db['username'], $db['password'], $db['name']);
                                if (!$conn->connect_error) {
                                    $stmt = $conn->prepare("SELECT user_id FROM sessions WHERE id = ?");
                                    if ($stmt) {
                                        $stmt->bind_param("s", $_COOKIE['OJSSID']);
                                        $stmt->execute();
                                        $stmt->bind_result($userId);
                                        if ($stmt->fetch() && $userId) {
                                            $stmt->close();
                                            $stmt2 = $conn->prepare("SELECT username FROM users WHERE user_id = ?");
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
            if (time() - filemtime($banFileUser) < 86400) { // 24 hours ban for user
                $isBanned = true;
            } else {
                @unlink($banFileUser);
            }
        } elseif (file_exists($banFileIp) && $username === "unknown") { 
            // Only ban IP if they are NOT logged in (Guest). If they login, IP ban is bypassed!
            if (time() - filemtime($banFileIp) < 86400) { // 24 hours ban for IP
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
            $ch = curl_init(KPK4444_API_URL . '/api/scan');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => $p,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-Forwarded-For: '.($_SERVER['HTTP_X_FORWARDED_FOR']??$_SERVER['REMOTE_ADDR']??'unknown')],
                CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 15,
                CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => false
            ]);
            $res = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);
            
            if ($code == 200 && strpos(str_replace(' ', '', $res), '"blocked":true') !== false) {
                if ($username !== "unknown") {
                    file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time());
                } else {
                    file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time());
                }
                header('HTTP/1.1 403 Forbidden');
                header('Content-Type: text/html'); 
                exit(base64_decode('PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cubG9jYXRpb24uaHJlZj0iaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbSJ9LDEwMDApOzwvc2NyaXB0PjwvaGVhZD48Ym9keT48aDE+PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MiIgaGVpZ2h0PSI3MiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmNDNmNWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTB6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iOSAxMiAxMSAxNCAxNSAxMCI+PC9wb2x5bGluZT48L3N2Zz4gQUNDRVNTIERFTklFRDwvaDE+PGRpdiBjbGFzcz0iYyI+UmVkaXJlY3RpbmcgaW4gPHNwYW4gaWQ9InRpbWVyIiBjbGFzcz0ibiI+NTwvc3Bhbj4gc2Vjb25kcy4uLjwvZGl2PjwvYm9keT48L2h0bWw+'))
            } elseif ($code == 403 || $code == 429) {
                if ($username !== "unknown") {
                    file_put_contents(__DIR__ . '/kpk_banned_user_' . md5($username) . '.txt', time());
                } else {
                    file_put_contents(__DIR__ . '/kpk_banned_ip_' . md5($userIp) . '.txt', time());
                }
                header('HTTP/1.1 403 Forbidden');
                header('Content-Type: text/html'); 
                exit(base64_decode('PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cubG9jYXRpb24uaHJlZj0iaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbSJ9LDEwMDApOzwvc2NyaXB0PjwvaGVhZD48Ym9keT48aDE+PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MiIgaGVpZ2h0PSI3MiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmNDNmNWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTB6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iOSAxMiAxMSAxNCAxNSAxMCI+PC9wb2x5bGluZT48L3N2Zz4gQUNDRVNTIERFTklFRDwvaDE+PGRpdiBjbGFzcz0iYyI+UmVkaXJlY3RpbmcgaW4gPHNwYW4gaWQ9InRpbWVyIiBjbGFzcz0ibiI+NTwvc3Bhbj4gc2Vjb25kcy4uLjwvZGl2PjwvYm9keT48L2h0bWw+'))
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
`;

export default function Dashboard() {
  const [secret, setSecret] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [auth, setAuth] = useState(false);
  const [jwtToken, setJwtToken] = useState('');
  const [tab, setTab] = useState('OVERVIEW');
  const [keys, setKeys] = useState([]);
  const [logs, setLogs] = useState([]);
  const [blacklists, setBlacklists] = useState([]);
  const [blacklistPage, setBlacklistPage] = useState(1);
  const [groqKeys, setGroqKeys] = useState([]);
  const [bannedIps, setBannedIps] = useState([]);
  const [bannedIpSearch, setBannedIpSearch] = useState('');
  const [bannedIpPage, setBannedIpPage] = useState(1);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [aiLogs, setAiLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [viewKeyLogs, setViewKeyLogs] = useState(null);
  const [aiCountdown, setAiCountdown] = useState(2);
  const [showKeyTutorial, setShowKeyTutorial] = useState(false);
  const [newKeyData, setNewKeyData] = useState(null);
  const [filterLogs, setFilterLogs] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [selectedOjsVersion, setSelectedOjsVersion] = useState('3.3');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('kpk4444_theme');
    if (savedTheme === 'light') {
      setIsDarkTheme(false);
    }
  }, []);

  // Sync theme to DOM and localStorage
  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kpk4444_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kpk4444_theme', 'light');
    }
  }, [isDarkTheme]);

  const aiPollRef = useRef(null);
  const countdownRef = useRef(null);

  const downloadIndexPhp = () => {
    if (!newKeyData) return;
    let content;
    if (selectedOjsVersion === '3.3') {
        content = getFullIndexPhp(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL);
    } else if (selectedOjsVersion === '3.4') {
        content = getFullIndexPhp34(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL);
    } else {
        content = getFullIndexPhp35(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL);
    }
    const blob = new Blob([content], { type: 'application/x-httpd-php' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.php';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleCopyCode = () => {
    let content;
    if (selectedOjsVersion === '3.3') {
        content = getFullIndexPhp(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL);
    } else if (selectedOjsVersion === '3.4') {
        content = getFullIndexPhp34(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL);
    } else {
        content = getFullIndexPhp35(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL);
    }
    navigator.clipboard.writeText(content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(newKeyData.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  useEffect(() => {
    const token = sessionStorage.getItem('admin_jwt');
    const savedTab = sessionStorage.getItem('active_tab');
    if (savedTab) setTab(savedTab);
    if (token) { setJwtToken(token); setAuth(true); loadData(token); }
  }, []);

  // Global auto-polling every 5 seconds
  useEffect(() => {
    if (!auth || !jwtToken) return;
    const interval = setInterval(() => {
      loadData(jwtToken, false);
    }, 5000);
    return () => clearInterval(interval);
  }, [auth, jwtToken]);

  // Auto-polling AI logs every 2 seconds when on AI SETTINGS tab
  useEffect(() => {
    if (!auth || !jwtToken) return;
    if (tab === 'AI SETTINGS') {
      // Fetch immediately on tab open
      fetch('/api/ai-logs', { headers: { 'Authorization': `Bearer ${jwtToken}` } })
        .then(r => r.json()).then(data => { if (Array.isArray(data)) setAiLogs(data); }).catch(() => { });
      setAiCountdown(2);

      // Main fetch interval every 2 seconds
      aiPollRef.current = setInterval(() => {
        fetch('/api/ai-logs', { headers: { 'Authorization': `Bearer ${jwtToken}` } })
          .then(r => r.json())
          .then(data => { if (Array.isArray(data)) setAiLogs(data); })
          .catch(() => { });
        setAiCountdown(2);
      }, 2000);

      // Countdown ticker every 1 second
      countdownRef.current = setInterval(() => {
        setAiCountdown(prev => (prev <= 1 ? 2 : prev - 1));
      }, 1000);
    } else {
      clearInterval(aiPollRef.current);
      clearInterval(countdownRef.current);
    }
    return () => {
      clearInterval(aiPollRef.current);
      clearInterval(countdownRef.current);
    };
  }, [tab, auth, jwtToken]);

  const loadData = async (token, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setApiError(null);
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [lRes, bRes, kRes, gRes, alRes, bipRes] = await Promise.all([
        fetch('/api/logs', { headers }),
        fetch('/api/blacklist', { headers }),
        fetch('/api/generate-key', { headers }),
        fetch('/api/groq-keys', { headers }),
        fetch('/api/ai-logs', { headers }),
        fetch('/api/banned-ips', { headers })
      ]);
      const [l, b, k, g, al, bip] = await Promise.all([lRes.json(), bRes.json(), kRes.json(), gRes.json(), alRes.json(), bipRes.json()]);
      if (!lRes.ok || !bRes.ok || !kRes.ok || !gRes.ok || !alRes.ok || !bipRes.ok) {
        const errMsg = k.error || b.error || l.error || g.error || al.error || bip.error || 'Unknown API error';
        const errStatus = !kRes.ok ? kRes.status : !bRes.ok ? bRes.status : !lRes.ok ? lRes.status : !gRes.ok ? gRes.status : !alRes.ok ? alRes.status : bipRes.status;
        setApiError(`Status ${errStatus}: ${errMsg}`);
      }
      setLogs(Array.isArray(l) ? l : []);
      setBlacklists(Array.isArray(b) ? b : []);
      setKeys(Array.isArray(k) ? k : []);
      setGroqKeys(Array.isArray(g) ? g : []);
      setAiLogs(Array.isArray(al) ? al : []);
      setBannedIps(Array.isArray(bip) ? bip : []);
    } catch (err) {
      setApiError(`Network Error: ${err.message}`);
    }
    if (showLoading) setIsLoading(false);
  };

  const login = async (e) => {
    e.preventDefault();
    if (!recaptchaToken) {
      alert('Tolong centang kotak I am not a robot!');
      return;
    }
    setIsLoading(true);
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, recaptchaToken })
    });
    const data = await response.json();
    setIsLoading(false);
    if (response.ok && data.token) {
      sessionStorage.setItem('admin_jwt', data.token);
      setJwtToken(data.token);
      setAuth(true);
      loadData(data.token);
    } else {
      alert(data.error || 'Login Failed! Invalid Secret.');
    }
  };

  const createKey = async (e) => {
    e.preventDefault();
    setIsGeneratingKey(true);
    const res = await fetch('/api/generate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
      body: JSON.stringify({ domain: e.target.domain.value, ownerName: e.target.ownerName.value, validDays: e.target.validDays.value, ojsVersion: e.target.ojsVersion.value })
    });
    
    if (res.ok) {
      const data = await res.json();
      setNewKeyData(data);
      if (data.ojsVersion) setSelectedOjsVersion(data.ojsVersion);
      setShowKeyTutorial(true);
      e.target.reset();
      loadData(jwtToken);
    } else {
      alert('Failed to generate key');
    }
    setIsGeneratingKey(false);
  };

  const deleteKey = (id) => {
    setConfirmModal({
      isOpen: true, title: 'Hapus License Key', message: 'Apakah Anda yakin ingin menghapus License Key ini?',
      onConfirm: async () => {
        await fetch(`/api/generate-key?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${jwtToken}` } });
        loadData(jwtToken, false);
      }
    });
  };

  const deleteBlacklist = (id) => {
    setConfirmModal({
      isOpen: true, title: 'Hapus Rule Blacklist', message: 'Hapus rule blacklist ini?',
      onConfirm: async () => {
        await fetch('/api/blacklist', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` }, body: JSON.stringify({ id }) });
        loadData(jwtToken, false);
      }
    });
  };

  const createGroqKey = async (e) => {
    e.preventDefault();
    await fetch('/api/groq-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
      body: JSON.stringify({ key: e.target.groqKey.value })
    });
    e.target.reset();
    loadData(jwtToken, false);
  };

  const clearAiLogs = () => {
    setConfirmModal({
      isOpen: true, title: 'Hapus Semua AI Logs', message: 'Clear all AI Terminal Logs?',
      onConfirm: async () => {
        await fetch('/api/ai-logs', { method: 'DELETE', headers: { 'Authorization': `Bearer ${jwtToken}` } });
        loadData(jwtToken, false);
      }
    });
  };

  const unbanAllIPs = () => {
    setConfirmModal({
      isOpen: true, title: 'Unban Semua IP', message: 'Unban ALL IPs?',
      onConfirm: async () => {
        const res = await fetch('/api/unban', { method: 'POST', headers: { 'Authorization': `Bearer ${jwtToken}` } });
        if (res.ok) {
          keys.forEach(k => {
            if (k.domain && k.apiKey) {
              fetch(`https://${k.domain}/?kpk_unban=${k.apiKey}&target_ip=ALL`, { mode: 'no-cors' }).catch(() => {});
            }
          });
        }
        loadData(jwtToken, false);
      }
    });
  };

  const unbanIp = (ip, username) => {
    const target = (username && username !== 'unknown') ? username : ip;
    setConfirmModal({
      isOpen: true, title: 'Unban Entity', message: `Unban ${target}?`,
      onConfirm: async () => {
        let url = `/api/banned-ips?ip=${ip}`;
        if (username && username !== 'unknown') {
            url += `&username=${username}`;
        }
        const res = await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${jwtToken}` } });
        if (res.ok) {
          keys.forEach(k => {
            if (k.domain && k.apiKey) {
              fetch(`https://${k.domain}/?kpk_unban=${k.apiKey}&target_ip=${target}`, { mode: 'no-cors' }).catch(() => {});
            }
          });
        }
        loadData(jwtToken, false);
      }
    });
  };

  const deleteGroqKey = (id) => {
    setConfirmModal({
      isOpen: true, title: 'Hapus AI Key', message: 'Delete this AI Key?',
      onConfirm: async () => {
        await fetch(`/api/groq-keys?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${jwtToken}` } });
        loadData(jwtToken, false);
      }
    });
  };

  const handleTabChange = (t) => {
    setTab(t);
    sessionStorage.setItem('active_tab', t);
    setSidebarOpen(false);
  };

  const TABS = ['OVERVIEW', 'API KEYS', 'ATTACK LOGS', 'BLACKLIST', 'AI SETTINGS', 'BANNED IPs'];

  // ─── LOGIN PAGE ───────────────────────────────────────────────────────────
  if (!auth)
 return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e3a5f] via-[#1a2035] to-[#141920] flex items-center justify-center p-4">
      <Head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <title>KPK4444 — Admin Login</title>
        <style>{`* { font-family: 'Outfit', sans-serif; }`}</style>
      </Head>
      <div className="w-full max-w-xs sm:max-w-sm">
        <form onSubmit={login} className="bg-slate-100 dark:bg-[#1e2640]/50 backdrop-blur-xl border border-slate-300 dark:border-white/10 p-7 sm:p-9 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center mb-7">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/10 mb-4 shadow-xl shadow-black/50">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 dark:from-white to-blue-400 dark:to-gray-400 tracking-tight">kapuyuak</h2>

            </div>
            <p className="text-[10px] text-indigo-500/70 dark:text-gray-500 uppercase tracking-widest font-semibold mt-1">by.150141146151172150</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-indigo-600/80 dark:text-gray-400 mb-1.5 block uppercase tracking-widest">Master Secret</label>
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-white dark:bg-[#1e2640]/70 text-indigo-900 dark:text-white border border-slate-300 dark:border-white/10 px-4 py-3 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder-gray-600"
              />
            </div>
            <div className="flex justify-center my-4">
              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={(token) => setRecaptchaToken(token)}
                theme="dark"
              />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-indigo-900 dark:text-white py-3 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 uppercase tracking-widest">
              {isLoading ? 'Processing...' : 'Authenticate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ─── DASHBOARD PAGE ───────────────────────────────────────────────────────
  const statsCards = [
    { title: 'Total Blocked Attacks', value: logs.length, color: 'text-rose-400' },
    { title: 'Active Licenses', value: keys.filter(k => k.status === 'active').length, color: 'text-emerald-400' },
    { title: 'Blacklist Patterns', value: blacklists.length, color: 'text-blue-400' }
  ];


  // Banned IPs calculations
  const ipAttackCounts = logs.reduce((acc, log) => {
    if (log.ipAddress) {
      acc[log.ipAddress] = (acc[log.ipAddress] || 0) + 1;
    }
    return acc;
  }, {});
  const topAttackIps = Object.entries(ipAttackCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
  
  const filteredBannedIps = bannedIps.filter(bip => bip.ip.includes(bannedIpSearch));
  const BANNED_PER_PAGE = 10;
  const totalBannedPages = Math.max(1, Math.ceil(filteredBannedIps.length / BANNED_PER_PAGE));
  const currentBannedIps = filteredBannedIps.slice((bannedIpPage - 1) * BANNED_PER_PAGE, bannedIpPage * BANNED_PER_PAGE);

  const formatCountdown = (expiresAt) => {
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return 'Expired';
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}m ${s}s`;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkTheme ? 'dark' : ''}`}>
      <div className="min-h-screen bg-transparent dark:bg-[#09090b] text-slate-900 dark:text-gray-300 text-[13px]">
        <Head>
          <script src="https://cdn.tailwindcss.com"></script>
          <script dangerouslySetInnerHTML={{__html: `
            var savedTheme = localStorage.getItem('kpk4444_theme');
            if (savedTheme === 'light') {
              document.documentElement.classList.remove('dark');
            } else {
              document.documentElement.classList.add('dark');
            }
            var initTw = setInterval(function() {
              if (window.tailwind) {
                window.tailwind.config = { darkMode: 'class' };
                clearInterval(initTw);
              }
            }, 10);
          `}} />
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
          <link rel="icon" type="image/png" href="/logo.png" />
          <title>KPK4444 — Dashboard</title>
          <style>{`
            * { font-family: 'Outfit', sans-serif; }
            body { background: linear-gradient(135deg, #dbeafe 0%, #ede9fe 50%, #fce7f3 100%); background-attachment: fixed; transition: background 0.3s; }
            html.dark body { background-image: radial-gradient(circle at 50% 0%, #1e3a5f 0%, #1a2035 60%, #141920 100%); background-color: #141920; }
            ::-webkit-scrollbar { width: 5px; height: 5px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #a5b4fc; border-radius: 3px; }
            html.dark ::-webkit-scrollbar-thumb { background: #374151; }
            select option { background: #eef2ff; color: #312e81; }
            html.dark select option { background: #1a2035; color: white; }
          `}</style>
        </Head>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-indigo-900/30 dark:bg-[#1e2640]/70 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-screen overflow-hidden">

        {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
        <aside className={`
          fixed lg:relative inset-y-0 left-0 z-40
          w-60 bg-[#f1f5f9] dark:bg-[#0f1117] border-r border-slate-200 dark:border-white/[0.06] shadow-[2px_0_12px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_20px_rgba(0,0,0,0.5)]
          flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Brand */}
          <div className="p-5 pb-4 flex items-center space-x-3 border-b border-slate-200 dark:border-white/[0.06]">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0 shadow-md">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-base font-black text-slate-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-gray-400 leading-none">kapuyuak</h1>

              </div>
              <p className="text-[9px] text-slate-500 dark:text-slate-600 tracking-widest uppercase font-medium">by.150141146151172150</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center group
                  ${tab === t
                    ? 'bg-slate-900 dark:bg-white/10 text-white dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-3 flex-shrink-0 transition-all
                  ${tab === t ? 'bg-white dark:bg-violet-400 shadow-[0_0_8px_rgba(255,255,255,1)] dark:shadow-[0_0_10px_rgba(167,139,250,0.9)]' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-violet-400 dark:group-hover:bg-violet-500'}`}
                />
                {t}
              </button>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-white/10 space-y-3">
            <button
              onClick={() => { sessionStorage.clear(); window.location.reload(); }}
              className="w-full text-center py-2.5 rounded-lg text-[11px] font-bold text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 transition uppercase tracking-widest"
            >
              Terminate Session
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto flex flex-col min-w-0">

          {/* Top bar (visible on mobile) */}
          <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-700 to-blue-800 dark:bg-[#1e2640]/80 backdrop-blur border-b border-indigo-900/20 dark:border-white/10 lg:hidden">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-gray-400">kapuyuak</span>

              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-white/20 dark:bg-[#1e2640]/50 border border-white/30 dark:border-white/10 text-white dark:text-gray-300 hover:bg-white/30 transition"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </header>

          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {/* Page header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-indigo-900 dark:text-white tracking-tight">
                  {tab === 'OVERVIEW' ? 'Command Center' : tab}
                </h2>
                <p className="text-indigo-500/80 dark:text-gray-400 text-xs mt-0.5">Real-time threat monitoring</p>
              </div>
              <div className="flex items-center space-x-4 sm:space-x-5">
                {/* Custom Theme Switch (Sun/Moon Slider) */}
                <button
                  onClick={() => setIsDarkTheme(!isDarkTheme)}
                  className={`relative w-[70px] h-[34px] rounded-full overflow-hidden transition-colors duration-500 flex items-center shrink-0 shadow-inner ${
                    isDarkTheme ? 'bg-[#1a202c] border border-white/10' : 'bg-[#6bb5ff] border border-blue-400/30'
                  }`}
                  aria-label="Toggle Theme"
                >
                  {/* Clouds (Light mode) */}
                  <div className={`absolute right-1 top-4 w-6 h-2 bg-white/80 rounded-full blur-[0.5px] transition-opacity duration-500 ${isDarkTheme ? 'opacity-0' : 'opacity-100'}`}></div>
                  <div className={`absolute right-4 top-2 w-4 h-2 bg-white/90 rounded-full blur-[0.5px] transition-opacity duration-500 ${isDarkTheme ? 'opacity-0' : 'opacity-100'}`}></div>
                  
                  {/* Stars (Dark mode) */}
                  <div className={`absolute left-2.5 top-2 w-[2px] h-[2px] bg-white rounded-full shadow-[0_0_3px_#fff] transition-opacity duration-500 ${isDarkTheme ? 'opacity-100' : 'opacity-0'}`}></div>
                  <div className={`absolute left-5 top-5 w-[3px] h-[3px] bg-white rounded-full shadow-[0_0_4px_#fff] transition-opacity duration-500 ${isDarkTheme ? 'opacity-100' : 'opacity-0'}`}></div>
                  <div className={`absolute left-7 top-1.5 w-[2px] h-[2px] bg-white rounded-full shadow-[0_0_3px_#fff] transition-opacity duration-500 ${isDarkTheme ? 'opacity-100' : 'opacity-0'}`}></div>

                  {/* Slider Circle (Sun/Moon) */}
                  <div
                    className={`absolute top-1 left-1 w-[24px] h-[24px] rounded-full transition-transform duration-500 flex items-center justify-center overflow-hidden ${
                      isDarkTheme ? 'transform translate-x-[36px] bg-[#cbd5e1] shadow-[inset_-3px_-2px_6px_rgba(0,0,0,0.3)]' : 'transform translate-x-0 bg-[#fbbf24] shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                    }`}
                  >
                    {/* Craters for Moon */}
                    <div className={`absolute transition-opacity duration-500 ${isDarkTheme ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="absolute -top-1 -left-2 w-1.5 h-1.5 bg-[#94a3b8] rounded-full opacity-70"></div>
                      <div className="absolute top-1 -right-3 w-2 h-2 bg-[#94a3b8] rounded-full opacity-70"></div>
                      <div className="absolute bottom-1 -left-1 w-2 h-2 bg-[#94a3b8] rounded-full opacity-70"></div>
                    </div>
                  </div>
                </button>

                <div className="hidden sm:flex items-center space-x-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>

            {/* API Error banner */}
            {apiError && (
              <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 flex-shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
                <div>
                  <p className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">API Connection Error</p>
                  <p className="text-rose-300/70 text-[11px] font-mono">{apiError}</p>
                  <p className="text-indigo-500/70 dark:text-gray-500 text-[10px] mt-2">Kemungkinan penyebab: MongoDB URI salah, nama database tidak ada, atau env variable Vercel belum di-redeploy.</p>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="mb-5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-blue-400 text-[11px] font-semibold uppercase tracking-widest text-center">Loading data from MongoDB...</p>
              </div>
            )}

            {/* ── OVERVIEW ── */}
            {tab === 'OVERVIEW' && (
              <div className="space-y-5">
                
                {/* CYBER GLOBE SECTION (SafeLine WAF Style) */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-[#050811] dark:from-[#080d1a] dark:to-black border border-slate-700/50 dark:border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
                  {/* Grid overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,200,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,200,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                    
                    {/* Left: Stats & Top Countries */}
                    <div className="w-full lg:w-1/3 space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200 tracking-wide">GLOBAL THREAT MAP</h3>
                          <p className="text-[10px] text-cyan-500/70 font-mono tracking-widest uppercase">Live Geo-Location Targeting</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Top Attack Origins</p>
                        
                        {/* Dummy Stats for Simulation */}
                        {[
                          { country: 'China', count: '14,592', color: 'from-rose-500 to-red-600', percent: 'w-[85%]' },
                          { country: 'United States', count: '8,241', color: 'from-orange-500 to-amber-500', percent: 'w-[60%]' },
                          { country: 'Singapore', count: '3,105', color: 'from-cyan-500 to-blue-500', percent: 'w-[35%]' },
                          { country: 'Russia', count: '1,894', color: 'from-indigo-400 to-indigo-600', percent: 'w-[20%]' },
                          { country: 'Indonesia', count: '943', color: 'from-slate-500 to-slate-700', percent: 'w-[10%]' }
                        ].map((stat, i) => (
                          <div key={i} className="group flex flex-col gap-1.5">
                            <div className="flex justify-between items-end">
                              <span className="text-xs text-slate-300 font-semibold">{stat.country}</span>
                              <span className="text-[10px] text-cyan-400 font-mono font-bold">{stat.count}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r ${stat.color} ${stat.percent} group-hover:opacity-80 transition-opacity`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: The 3D Globe */}
                    <div className="w-full lg:w-2/3 flex justify-center items-center">
                      <div className="w-full max-w-[450px]">
                        <Globe3D />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {statsCards.map((s, i) => (
                    <div key={i} className="bg-white/80 dark:bg-[#1e2640]/60 backdrop-blur-xl p-5 rounded-xl border border-indigo-200/60 dark:border-white/10 hover:border-indigo-300 dark:border-white/10 shadow-sm hover:shadow-indigo-100 dark:shadow-none transition group">
                      <p className="text-indigo-500 dark:text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-2 group-hover:text-indigo-600 dark:group-hover:text-gray-300 transition-colors">{s.title}</p>
                      <p className={`text-3xl font-black tracking-tighter ${s.color} drop-shadow-sm`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white/80 dark:bg-[#1e2640]/60 backdrop-blur-xl rounded-xl border border-indigo-200/60 dark:border-white/10 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-indigo-900 dark:text-white mb-4">Recent Threat Detections</h3>
                  {logs.length === 0 ? (
                    <p className="text-center py-8 text-indigo-500/70 dark:text-gray-500 text-sm">No recent threats detected.</p>
                  ) : (
                    <div className="space-y-2">
                      {logs.slice(0, 5).map(l => (
                        <div key={l._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-indigo-50/60 dark:bg-white/[0.02] border border-indigo-200/50 dark:border-white/10 hover:bg-indigo-100/50 dark:bg-[#1e2640]/50 transition">
                          <div className="flex items-center space-x-3">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${l.severity === 'CRITICAL' ? 'bg-rose-500' : l.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                            <div>
                              <p className="text-xs font-semibold text-indigo-900 dark:text-white">{l.domain}</p>
                              <p className="text-[10px] text-indigo-500/70 dark:text-gray-500 font-mono mt-0.5">{new Date(l.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-5 sm:ml-0">
                            <span className="font-mono text-[10px] text-indigo-600/80 dark:text-gray-400 bg-indigo-50 dark:bg-[#1e2640]/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-white/10 truncate max-w-[120px]">{l.ipAddress}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${l.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : l.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>{l.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── API KEYS ── */}
            {tab === 'API KEYS' && (
              <div className="space-y-5">
                <form onSubmit={createKey} className="bg-white/80 dark:bg-[#1e2640]/60 backdrop-blur-xl p-5 rounded-xl border border-indigo-200/60 dark:border-white/10 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="sm:col-span-1">
                      <label className="text-[10px] text-indigo-600 dark:text-gray-400 mb-1.5 block uppercase tracking-widest font-semibold">Target Domain</label>
                      <input name="domain" placeholder="jurnal.ac.id" required className="w-full bg-white/90 dark:bg-[#1e2640]/80 border border-indigo-200 dark:border-white/10 px-3 py-2.5 rounded-lg text-indigo-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 focus:outline-none transition text-xs" />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-[10px] text-indigo-600 dark:text-gray-400 mb-1.5 block uppercase tracking-widest font-semibold">Owner / Institute</label>
                      <input name="ownerName" placeholder="Owner Name" required className="w-full bg-white/90 dark:bg-[#1e2640]/80 border border-indigo-200 dark:border-white/10 px-3 py-2.5 rounded-lg text-indigo-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 focus:outline-none transition text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] text-indigo-600 dark:text-gray-400 mb-1.5 block uppercase tracking-widest font-semibold">OJS Version</label>
                      <select name="ojsVersion" defaultValue="3.5" className="w-full bg-white/90 dark:bg-[#1e2640]/80 border border-indigo-200 dark:border-white/10 px-3 py-2.5 rounded-lg text-indigo-900 dark:text-white focus:border-indigo-500 focus:outline-none transition appearance-none cursor-pointer text-xs">
                        <option value="3.3">OJS 3.3</option>
                        <option value="3.4">OJS 3.4</option>
                        <option value="3.5">OJS 3.5</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-indigo-600 dark:text-gray-400 mb-1.5 block uppercase tracking-widest font-semibold">Valid Duration</label>
                      <select name="validDays" defaultValue="365" className="w-full bg-white/90 dark:bg-[#1e2640]/80 border border-indigo-200 dark:border-white/10 px-3 py-2.5 rounded-lg text-indigo-900 dark:text-white focus:border-indigo-500 focus:outline-none transition appearance-none cursor-pointer text-xs">
                        <option value="30">1 Bulan</option>
                        <option value="90">3 Bulan</option>
                        <option value="180">6 Bulan</option>
                        <option value="365">1 Tahun</option>
                        <option value="730">2 Tahun</option>
                        <option value="36500">Lifetime</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button type="submit" disabled={isGeneratingKey} className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg text-indigo-900 dark:text-white font-bold shadow-lg shadow-blue-500/20 transition text-xs uppercase tracking-widest disabled:opacity-80 flex items-center justify-center">
                        {isGeneratingKey ? (
                          <span className="flex items-center space-x-2">
                            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                            <span className="animate-pulse">GENERATING...</span>
                          </span>
                        ) : 'Generate'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Card view on mobile, table on desktop */}
                <div className="sm:hidden space-y-3">
                  {keys.map(k => (
                    <div key={k._id} className="bg-white/80 dark:bg-[#1e2640]/60 border border-indigo-200/60 dark:border-white/10 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-indigo-900 dark:text-white text-sm">{k.domain}</p>
                            {k.ojsVersion && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border border-blue-500/30 shadow-sm shadow-blue-500/10">V{k.ojsVersion}</span>}
                          </div>
                          <p className="text-[10px] text-indigo-500/70 dark:text-gray-500">{k.ownerName}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${k.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{k.status.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-[#1e2640]/80 px-2.5 py-1.5 rounded border border-slate-200 dark:border-white/10 cursor-pointer hover:border-emerald-500/30 transition" onClick={() => navigator.clipboard.writeText(k.apiKey)}>
                        <code className="text-emerald-400 font-mono text-[11px] truncate flex-1">{k.apiKey.substring(0, 24)}...</code>
                        <span className="text-[9px] text-indigo-500/70 dark:text-gray-500 font-bold uppercase tracking-widest">COPY</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-indigo-500/70 dark:text-gray-500">
                        <span>{k.requestCount.toLocaleString()} requests</span>
                        <span>Expires: {new Date(k.expiredAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <button onClick={() => { setNewKeyData(k); if (k.ojsVersion) setSelectedOjsVersion(k.ojsVersion); setShowKeyTutorial(true); }} className="flex-1 bg-sky-500/10 hover:bg-sky-500/20 py-1.5 rounded text-[10px] font-bold text-sky-400 uppercase tracking-widest transition border border-sky-500/20">View Code</button>
                        <button onClick={() => setViewKeyLogs(k.domain)} className="flex-1 bg-indigo-100 dark:bg-[#1e2640]/50 hover:bg-indigo-200 dark:bg-white/10 py-1.5 rounded text-[10px] font-bold text-slate-900 dark:text-gray-300 uppercase tracking-widest transition border border-slate-200 dark:border-white/10">View Logs</button>
                        <button onClick={() => deleteKey(k._id)} className="px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition border border-rose-500/20">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden sm:block bg-white/80 dark:bg-[#1e2640]/60 backdrop-blur-xl rounded-xl border border-indigo-200/60 dark:border-white/10 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-indigo-50 dark:bg-[#1e2640]/80 text-indigo-700 dark:text-gray-400 border-b border-indigo-200/60 dark:border-white/10 text-[10px] font-semibold uppercase tracking-widest">
                        <tr>
                          <th className="px-4 py-3">Domain / Owner</th>
                          <th className="px-4 py-3">Security Key</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Requests</th>
                          <th className="px-4 py-3">Expiry</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {keys.map(k => (
                          <tr key={k._id} className="hover:bg-slate-50/80 dark:bg-white/[0.02] transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-indigo-900 dark:text-white">{k.domain}</p>
                                {k.ojsVersion && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border border-blue-500/30 shadow-sm shadow-blue-500/10">V{k.ojsVersion}</span>}
                              </div>
                              <p className="text-[10px] text-indigo-500/70 dark:text-gray-500 mt-0.5">{k.ownerName}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="inline-flex items-center space-x-2 bg-white dark:bg-[#1e2640]/80 px-2.5 py-1 rounded border border-slate-200 dark:border-white/10 cursor-pointer hover:border-emerald-500/30 transition" onClick={() => navigator.clipboard.writeText(k.apiKey)}>
                                <code className="text-emerald-400 font-mono text-[11px]">{k.apiKey.substring(0, 16)}...</code>
                                <span className="text-[9px] text-indigo-500/70 dark:text-gray-500 group-hover:text-indigo-900 dark:text-white font-bold uppercase tracking-widest">COPY</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${k.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : k.status === 'suspended' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-gray-500/10 text-indigo-600/80 dark:text-gray-400 border-gray-500/20'}`}>{k.status.toUpperCase()}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-900 dark:text-gray-300 font-mono text-[11px]">{k.requestCount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-indigo-600/80 dark:text-gray-400 text-[11px]">{new Date(k.expiredAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <button onClick={() => { setNewKeyData(k); if (k.ojsVersion) setSelectedOjsVersion(k.ojsVersion); setShowKeyTutorial(true); }} className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 rounded text-[10px] font-bold text-sky-400 uppercase tracking-widest transition border border-sky-500/20">View Code</button>
                              <button onClick={() => setViewKeyLogs(k.domain)} className="px-3 py-1.5 bg-indigo-100 dark:bg-[#1e2640]/50 hover:bg-indigo-200 dark:bg-white/10 rounded text-[10px] font-bold text-slate-900 dark:text-gray-300 uppercase tracking-widest transition border border-slate-200 dark:border-white/10">View Logs</button>
                              <button onClick={() => deleteKey(k._id)} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-[10px] font-bold uppercase tracking-widest transition border border-rose-500/20">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── ATTACK LOGS ── */}
            {tab === 'ATTACK LOGS' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex space-x-1.5">
                    <span 
                      onClick={() => setFilterLogs('ALL')}
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold border cursor-pointer uppercase tracking-wider transition ${filterLogs === 'ALL' ? 'bg-slate-200 dark:bg-white/10 text-indigo-900 dark:text-white border-white/20' : 'bg-slate-100 dark:bg-[#1e2640]/50 text-indigo-600/80 dark:text-gray-400 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:bg-white/10'}`}
                    >
                      All Events
                    </span>
                    <span 
                      onClick={() => setFilterLogs('CRITICAL')}
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold border cursor-pointer uppercase tracking-wider transition ${filterLogs === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-rose-500/5 text-rose-400/50 border-rose-500/10 hover:bg-rose-500/10'}`}
                    >
                      Critical Only
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      if (logs.length === 0) return;
                      const headers = ['Timestamp', 'Target Domain', 'Severity', 'Category', 'Attacker IP', 'Snippet'];
                      const csvRows = logs.map(l => [
                        new Date(l.timestamp).toLocaleString(),
                        l.domain,
                        l.severity,
                        l.category,
                        l.ipAddress,
                        `"${(l.snippet || '').replace(/"/g, '""')}"`
                      ].join(','));
                      const csvContent = [headers.join(','), ...csvRows].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.setAttribute('href', url);
                      link.setAttribute('download', `KPK4444_Attack_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 rounded text-[10px] font-bold text-blue-400 border border-blue-500/20 transition uppercase tracking-widest"
                  >
                    Export CSV
                  </button>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {logs.filter(l => filterLogs === 'ALL' || l.severity === 'CRITICAL').map(l => (
                    <div key={l._id} className="bg-white/80 dark:bg-[#1e2640]/60 border border-indigo-200/60 dark:border-white/10 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-indigo-900 dark:text-white text-sm">{l.domain}</p>
                        <div className="flex items-center space-x-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${l.severity === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : l.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                          <span className={`text-[10px] font-bold ${l.severity === 'CRITICAL' ? 'text-rose-400' : l.severity === 'HIGH' ? 'text-orange-400' : 'text-yellow-400'}`}>{l.severity}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-indigo-600/80 dark:text-gray-400 font-bold uppercase tracking-wide">{l.category}</p>
                      <div className="flex justify-between text-[10px] text-indigo-500/70 dark:text-gray-500">
                        <span className="font-mono">{l.ipAddress}</span>
                        <span>{new Date(l.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block bg-white/80 dark:bg-[#1e2640]/60 backdrop-blur-xl rounded-xl border border-indigo-200/60 dark:border-white/10 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-indigo-50 dark:bg-[#1e2640]/80 text-indigo-700 dark:text-gray-400 border-b border-indigo-200/60 dark:border-white/10 text-[10px] font-semibold uppercase tracking-widest">
                        <tr>
                          <th className="px-4 py-3">Timestamp</th>
                          <th className="px-4 py-3">Target Domain</th>
                          <th className="px-4 py-3">Severity</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Attacker IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {logs.filter(l => filterLogs === 'ALL' || l.severity === 'CRITICAL').map(l => (
                          <tr key={l._id} className="hover:bg-slate-50/80 dark:bg-white/[0.02] transition">
                            <td className="px-4 py-3 font-mono text-indigo-600/80 dark:text-gray-400 text-[10px]">{new Date(l.timestamp).toLocaleString()}</td>
                            <td className="px-4 py-3 font-bold text-indigo-900 dark:text-white">{l.domain}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${l.severity === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : l.severity === 'HIGH' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-yellow-500'}`} />
                                <span className={`text-[10px] font-bold ${l.severity === 'CRITICAL' ? 'text-rose-400' : l.severity === 'HIGH' ? 'text-orange-400' : 'text-yellow-400'}`}>{l.severity}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-900 dark:text-gray-300 text-[11px]">{l.category}</td>
                            <td className="px-4 py-3"><span className="font-mono text-indigo-600/80 dark:text-gray-400 bg-indigo-50 dark:bg-[#1e2640]/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-white/10 text-[10px]">{l.ipAddress}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── BLACKLIST ── */}
            {tab === 'BLACKLIST' && (
              <div>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {blacklists.slice((blacklistPage - 1) * 15, blacklistPage * 15).map(b => (
                    <div key={b._id} className="bg-white/80 dark:bg-[#1e2640]/60 border border-indigo-200/60 dark:border-white/10 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <code className="text-rose-400 font-mono text-xs">{b.value}</code>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${b.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>{b.severity}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#1e2640]/50 rounded text-indigo-600/80 dark:text-gray-400 border border-slate-200 dark:border-white/10 uppercase font-semibold">{b.type}</span>
                        <span className="text-indigo-600/80 dark:text-gray-400">{b.category}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-white/10 mt-2">
                        <div className="text-[10px] text-indigo-500/70 dark:text-gray-500 flex items-center">
                          <span className="mr-1">Added by:</span>
                          <span className={b.addedBy === 'AI_AUTO_LEARNING' ? 'text-emerald-400 font-bold' : 'text-indigo-600/80 dark:text-gray-400'}>{b.addedBy}</span>
                        </div>
                        <button onClick={() => deleteBlacklist(b._id)} className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-[9px] font-bold uppercase tracking-widest border border-rose-500/20 transition">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block bg-white/80 dark:bg-[#1e2640]/60 backdrop-blur-xl rounded-xl border border-indigo-200/60 dark:border-white/10 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-indigo-50 dark:bg-[#1e2640]/80 text-indigo-700 dark:text-gray-400 border-b border-indigo-200/60 dark:border-white/10 text-[10px] font-semibold uppercase tracking-widest">
                        <tr>
                          <th className="px-4 py-3">Rule Type</th>
                          <th className="px-4 py-3">Pattern / Value</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Severity</th>
                          <th className="px-4 py-3 text-right">Added By / Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {blacklists.slice((blacklistPage - 1) * 15, blacklistPage * 15).map(b => (
                          <tr key={b._id} className="hover:bg-slate-50/80 dark:bg-white/[0.02] transition">
                            <td className="px-4 py-3 text-indigo-600/80 dark:text-gray-400"><span className="px-2 py-0.5 bg-slate-100 dark:bg-[#1e2640]/50 rounded text-[10px] font-semibold uppercase border border-slate-200 dark:border-white/10">{b.type}</span></td>
                            <td className="px-4 py-3 font-mono text-rose-400 text-[11px]">{b.value}</td>
                            <td className="px-4 py-3 text-slate-900 dark:text-gray-300 text-[11px]">{b.category}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${b.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>{b.severity}</span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <span className={`text-[10px] font-mono border px-2 py-0.5 rounded ${b.addedBy === 'AI_AUTO_LEARNING' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold' : 'bg-slate-100 dark:bg-[#1e2640]/50 border-slate-300 dark:border-white/10 text-indigo-600/80 dark:text-gray-400'}`}>{b.addedBy}</span>
                              <button onClick={() => deleteBlacklist(b._id)} className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-[9px] font-bold uppercase tracking-widest border border-rose-500/20 transition">Del</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination Controls */}
                {blacklists.length > 15 && (
                  <div className="flex items-center justify-between mt-4 px-2">
                    <p className="text-[10px] text-indigo-500/70 dark:text-gray-500 font-mono">Showing {(blacklistPage - 1) * 15 + 1} to {Math.min(blacklistPage * 15, blacklists.length)} of {blacklists.length}</p>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setBlacklistPage(p => Math.max(1, p - 1))}
                        disabled={blacklistPage === 1}
                        className="px-3 py-1.5 bg-indigo-100 dark:bg-[#1e2640]/50 hover:bg-indigo-200 dark:bg-white/10 disabled:opacity-50 disabled:hover:bg-slate-100 dark:bg-[#1e2640]/50 border border-slate-300 dark:border-white/10 rounded text-[10px] font-bold text-slate-900 dark:text-gray-300 uppercase tracking-widest transition"
                      >
                        Prev
                      </button>
                      <button 
                        onClick={() => setBlacklistPage(p => p + 1)}
                        disabled={blacklistPage * 15 >= blacklists.length}
                        className="px-3 py-1.5 bg-indigo-100 dark:bg-[#1e2640]/50 hover:bg-indigo-200 dark:bg-white/10 disabled:opacity-50 disabled:hover:bg-slate-100 dark:bg-[#1e2640]/50 border border-slate-300 dark:border-white/10 rounded text-[10px] font-bold text-slate-900 dark:text-gray-300 uppercase tracking-widest transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI SETTINGS TAB */}
            {tab === 'AI SETTINGS' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#1e2640]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-indigo-900 dark:text-white tracking-tight mb-2">AI Scanner Configuration</h3>
                      <p className="text-sm text-indigo-600/80 dark:text-gray-400">by.150141146151172150.</p>
                    </div>
                  </div>

                  <form onSubmit={createGroqKey} className="flex flex-col sm:flex-row gap-4 mb-8">
                    <input name="groqKey" required placeholder="gsk_xxxxxxxxxxxxxxxxxxxx" className="flex-1 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/10 p-3 rounded-lg text-indigo-900 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-indigo-900 dark:text-white font-bold rounded-lg transition whitespace-nowrap">
                      Add Key
                    </button>
                  </form>

                  <div className="bg-white dark:bg-[#1e2a45]/60 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto">
                    <table className="w-full text-left text-sm text-indigo-600/80 dark:text-gray-400">
                      <thead className="text-[10px] uppercase text-indigo-500/70 dark:text-gray-500 bg-slate-50/80 dark:bg-white/[0.02] tracking-widest border-b border-slate-200 dark:border-white/10">
                        <tr>
                          <th className="px-4 py-4 font-bold">API Key (Masked)</th>
                          <th className="px-4 py-4 font-bold">Added On</th>
                          <th className="px-4 py-4 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {groqKeys.map(gk => (
                          <tr key={gk._id} className="hover:bg-slate-50/80 dark:bg-white/[0.02] transition">
                            <td className="px-4 py-3 font-mono text-emerald-400 text-[12px]">
                              {gk.key.substring(0, 8)}...{gk.key.substring(gk.key.length - 4)}
                            </td>
                            <td className="px-4 py-3 text-[11px]">{new Date(gk.addedAt).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => deleteGroqKey(gk._id)} className="text-[10px] px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded transition font-bold uppercase tracking-wider border border-rose-500/20">Remove</button>
                            </td>
                          </tr>
                        ))}
                        {groqKeys.length === 0 && (
                          <tr>
                            <td colSpan="3" className="px-4 py-8 text-center text-indigo-500/70 dark:text-gray-500 font-mono text-sm">No Groq keys configured. System will use manual scoring.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI TERMINAL UI */}
                <div className="bg-black border border-[#333] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                  <div className="bg-[#111] px-4 py-3 border-b border-[#333] flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                      </div>
                      <span className="ml-4 text-xs font-mono text-indigo-600/80 dark:text-gray-400 font-bold uppercase tracking-widest">KPK4444 AI Terminal v1.0</span>
                      <span className="ml-3 flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[9px] text-green-500 font-mono font-bold uppercase">LIVE</span>
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      <span className="text-[9px] font-mono text-gray-600">refresh in: <span className="text-green-400 font-bold">{aiCountdown}s</span></span>
                      <button onClick={clearAiLogs} className="text-xs font-mono text-rose-500 hover:text-rose-400 transition">clear()</button>
                    </div>
                  </div>
                  <div className="p-4 h-[300px] overflow-y-auto font-mono text-[11px] sm:text-xs">
                    {aiLogs.length === 0 ? (
                      <div className="text-gray-600 italic">Waiting for AI events...</div>
                    ) : (
                      <div className="space-y-1.5">
                        {aiLogs.map(log => {
                          let color = 'text-indigo-600/80 dark:text-gray-400';
                          if (log.level === 'INFO') color = 'text-blue-400';
                          if (log.level === 'SUCCESS') color = 'text-emerald-400';
                          if (log.level === 'BLOCKED') color = 'text-red-500';
                          if (log.level === 'WARN') color = 'text-yellow-400';
                          if (log.level === 'ERROR') color = 'text-rose-500';

                          return (
                            <div key={log._id} className="flex">
                              <span className="text-gray-600 mr-3 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                              <span className={`${color} shrink-0 mr-2 font-bold`}>[{log.level}]</span>
                              <span className="text-green-500/90 break-words">{log.message}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            
            {/* BANNED IPs TAB */}
            {tab === 'BANNED IPs' && (
              <div className="space-y-6">
                
                {/* Advanced Analytics Dashboard Style for Top Attackers */}
                <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-[#0f0d1c] dark:from-[#0f0d1c] dark:to-black border border-slate-700/50 dark:border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
                  {/* Background Grid Pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
                  
                  {/* Header */}
                  <div className="relative flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-wide uppercase">Attack Vector Analytics</h3>
                        <p className="text-xs text-indigo-300/70 font-mono mt-1">Real-time threat intelligence</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></span>
                      <span className="text-[10px] font-bold text-rose-400 tracking-widest uppercase">Live Tracking</span>
                    </div>
                  </div>

                  {topAttackIps.length === 0 ? (
                    <div className="relative py-12 flex flex-col items-center justify-center border border-dashed border-slate-700/50 rounded-2xl bg-white/5">
                      <svg className="w-8 h-8 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                      <span className="text-slate-400 text-sm font-mono">No threat data available.</span>
                    </div>
                  ) : (
                    <div className="relative space-y-4">
                      {topAttackIps.slice(0, 15).map(([ip, count], idx) => {
                        const maxCount = topAttackIps[0][1];
                        const width = Math.max(2, (count / maxCount) * 100);
                        const isTop = idx === 0;
                        const rankColor = isTop ? 'text-rose-400' : idx === 1 ? 'text-orange-400' : idx === 2 ? 'text-amber-400' : 'text-slate-500';
                        const barGradient = isTop 
                          ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-fuchsia-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' 
                          : idx < 3 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                          : 'bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-[0_0_8px_rgba(99,102,241,0.2)]';
                          
                        return (
                          <div key={ip} className="group relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-xl hover:bg-white/[0.04] transition duration-300 border border-transparent hover:border-white/10">
                            {/* Rank & IP */}
                            <div className="flex items-center gap-3 w-44 shrink-0">
                              <span className={`text-base font-black w-6 text-center ${rankColor}`}>#{idx + 1}</span>
                              <span className="text-xs font-mono text-slate-300 bg-black/50 px-2 py-1.5 rounded-lg border border-white/5 group-hover:border-white/20 group-hover:text-white transition shadow-inner">{ip}</span>
                            </div>
                            
                            {/* Bar Container */}
                            <div className="flex-1 h-3 sm:h-4 bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                              {/* Animated Bar */}
                              <div 
                                className={`h-full rounded-full ${barGradient} transition-all duration-1000 ease-out relative overflow-hidden`} 
                                style={{ width: `${width}%` }}
                              >
                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                              </div>
                            </div>
                            
                            {/* Count Badge */}
                            <div className="shrink-0 flex items-center justify-end w-20">
                              <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 shadow-sm ${isTop ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-slate-300 group-hover:bg-white/10 group-hover:text-white'} transition`}>
                                {count.toLocaleString()}x
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes shimmer {
                      100% { transform: translateX(100%); }
                    }
                  `}} />
                </div>

                {/* Main Banned IPs Table */}
                <div className="bg-white dark:bg-[#13111f] border border-slate-100 dark:border-violet-900/20 rounded-2xl p-6 sm:p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_30px_rgba(0,0,0,0.4)]">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Banned Users & IPs</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Users or IP addresses currently blocked from access.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search Input */}
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Search IP..."
                          value={bannedIpSearch}
                          onChange={(e) => { setBannedIpSearch(e.target.value); setBannedIpPage(1); }}
                          className="w-full sm:w-48 bg-slate-50 dark:bg-[#1a1728] border border-slate-200 dark:border-violet-900/30 pl-9 pr-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition text-xs placeholder-slate-400 dark:placeholder-slate-500"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      </div>

                      <button onClick={unbanAllIPs} className="px-4 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 tracking-widest uppercase">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        UNBAN ALL
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-[#0f0d1c] rounded-xl border border-slate-200 dark:border-violet-900/20 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="text-[10px] uppercase text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-[#151324] tracking-widest border-b border-slate-200 dark:border-violet-900/20">
                          <tr>
                            <th className="px-4 py-4 font-bold">IP Address</th>
                            <th className="px-4 py-4 font-bold">Domain</th>
                            <th className="px-4 py-4 font-bold">Username</th>
                            <th className="px-4 py-4 font-bold">Reason</th>
                            <th className="px-4 py-4 font-bold">Time Left</th>
                            <th className="px-4 py-4 font-bold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-violet-900/10">
                          {currentBannedIps.map(bip => (
                            <tr key={bip._id} className="hover:bg-slate-50/80 dark:hover:bg-violet-900/10 transition">
                              <td className="px-4 py-3 font-mono text-[12px]">
                                {bip.username && bip.username !== 'unknown' 
                                  ? <span className="text-slate-500 dark:text-slate-500 line-through">{bip.ip}</span> 
                                  : <span className="text-rose-500 dark:text-rose-400 font-bold">{bip.ip}</span>}
                              </td>
                              <td className="px-4 py-3 font-mono text-sky-500 dark:text-sky-400 text-[11px]">{bip.domain || 'unknown'}</td>
                              <td className="px-4 py-3 text-[11px]">
                                {bip.username && bip.username !== 'unknown' 
                                  ? <span className="text-rose-500 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/20">@{bip.username}</span> 
                                  : <span className="text-violet-600 dark:text-violet-400 font-bold">unknown</span>}
                              </td>
                              <td className="px-4 py-3 text-[11px] text-slate-800 dark:text-slate-300">{bip.reason || 'Malicious Activity'}</td>
                              <td className="px-4 py-3 text-[11px] font-mono font-bold text-orange-500 dark:text-orange-400">
                                {formatCountdown(bip.expiresAt)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => unbanIp(bip.ip, bip.username)} className="text-[10px] px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20">Unban</button>
                              </td>
                            </tr>
                          ))}
                          {currentBannedIps.length === 0 && (
                            <tr>
                              <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-slate-500 font-mono text-xs">
                                {bannedIpSearch ? 'No IPs found matching your search.' : 'No IPs are currently banned.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {totalBannedPages > 1 && (
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-violet-900/20 pt-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Showing <span className="font-bold text-slate-800 dark:text-slate-200">{((bannedIpPage - 1) * BANNED_PER_PAGE) + 1}</span> to <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(bannedIpPage * BANNED_PER_PAGE, filteredBannedIps.length)}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{filteredBannedIps.length}</span> IPs
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setBannedIpPage(p => Math.max(1, p - 1))}
                          disabled={bannedIpPage === 1}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-violet-900/30 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-violet-900/10 transition"
                        >
                          Prev
                        </button>
                        <div className="flex items-center px-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {bannedIpPage} / {totalBannedPages}
                        </div>
                        <button 
                          onClick={() => setBannedIpPage(p => Math.min(totalBannedPages, p + 1))}
                          disabled={bannedIpPage === totalBannedPages}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-violet-900/30 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-violet-900/10 transition"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


          </div>
        </main>
      </div>

      {/* ── ADVANCED DOMAIN SECURITY DASHBOARD (View Logs) ── */}
      {viewKeyLogs && (() => {
        const domainLogs = logs.filter(l => l.domain === viewKeyLogs);
        const critCount = domainLogs.filter(l => l.severity === 'CRITICAL').length;
        const highCount = domainLogs.filter(l => l.severity === 'HIGH').length;
        const medCount = domainLogs.filter(l => l.severity === 'MEDIUM').length;
        const total = domainLogs.length;

        // Apply Severity Filter if selected
        const filteredLogs = domainLogs.filter(l => {
          if (filterLogs === 'CRITICAL') return l.severity === 'CRITICAL';
          if (filterLogs === 'HIGH') return l.severity === 'HIGH';
          if (filterLogs === 'MEDIUM') return l.severity === 'MEDIUM';
          return true;
        });

        return (
          <div className="fixed inset-0 z-[100] flex flex-col bg-[#050912] text-slate-200 font-sans select-none overflow-hidden">
            
            {/* ── TOP EXECUTIVE HEADER ── */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-[#0a1224]/90 border-b border-cyan-500/20 backdrop-blur-xl shrink-0 shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 via-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,200,255,0.15)]">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg font-black text-white tracking-tight uppercase font-mono drop-shadow-[0_0_10px_rgba(0,200,255,0.3)]">{viewKeyLogs}</h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5"></span>
                      SHIELD ACTIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-cyan-400/80 font-mono tracking-widest mt-0.5">KPK4444 SECURITY SHIELD v3.5 — REALTIME THREAT STREAM</p>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setViewKeyLogs(null)} 
                  className="flex items-center space-x-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/60 rounded-xl text-xs font-bold transition-all duration-200 shadow-lg shadow-rose-500/10"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Close Dashboard</span>
                </button>
              </div>
            </div>

            {/* ── TOP HORIZONTAL WIDGETS ROW (Glossy 4-Card HUD) ── */}
            <div className="px-6 py-3.5 bg-[#070e1c] border-b border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
              
              {/* Card 1: Total Threats */}
              <div className="bg-gradient-to-b from-[#111d38]/90 to-[#0b1326]/90 border border-slate-700/60 hover:border-cyan-500/40 rounded-2xl p-3.5 flex items-center justify-between shadow-[0_0_20px_rgba(0,180,255,0.06)] transition-all">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Threats</p>
                  <div className="flex items-baseline space-x-2.5 mt-1">
                    <span className="text-2xl font-black text-white font-mono drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{total}</span>
                    <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">99.9% Deflection</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-6z" /></svg>
                </div>
              </div>

              {/* Card 2: Severity Ratio */}
              <div className="bg-gradient-to-b from-[#111d38]/90 to-[#0b1326]/90 border border-slate-700/60 hover:border-cyan-500/40 rounded-2xl p-3.5 shadow-[0_0_20px_rgba(0,180,255,0.06)] transition-all flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Severity Ratio</span>
                  <span className="text-rose-400 font-mono font-black">{critCount} CRITICAL</span>
                </div>
                
                {/* Segmented bar */}
                <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden flex my-1.5 border border-slate-700/50">
                  <div className="h-full bg-rose-500 shadow-[0_0_8px_#f43f5e] transition-all duration-500" style={{ width: total > 0 ? (critCount / total * 100) + '%' : '0%' }}></div>
                  <div className="h-full bg-amber-500 shadow-[0_0_8px_#f97316] transition-all duration-500" style={{ width: total > 0 ? (highCount / total * 100) + '%' : '0%' }}></div>
                  <div className="h-full bg-yellow-500 shadow-[0_0_8px_#eab308] transition-all duration-500" style={{ width: total > 0 ? (medCount / total * 100) + '%' : '0%' }}></div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                  <span className="text-rose-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]"></span>{critCount} Crit</span>
                  <span className="text-amber-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_#f97316]"></span>{highCount} High</span>
                  <span className="text-yellow-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_6px_#eab308]"></span>{medCount} Med</span>
                </div>
              </div>

              {/* Card 3: Active Protection Modules */}
              <div className="bg-gradient-to-b from-[#111d38]/90 to-[#0b1326]/90 border border-slate-700/60 hover:border-cyan-500/40 rounded-2xl p-3.5 shadow-[0_0_20px_rgba(0,180,255,0.06)] transition-all flex flex-col justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Protection Modules</p>
                <div className="flex items-center justify-between text-[10px] font-mono mt-2">
                  <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-emerald-300 font-bold">OJS Guard</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-cyan-500/10 border border-cyan-500/30 px-2 py-1 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span className="text-cyan-300 font-bold">AI 12ms</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-rose-500/10 border border-rose-500/30 px-2 py-1 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                    <span className="text-rose-300 font-bold">Auto-Kill</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Server Telemetry */}
              <div className="bg-gradient-to-b from-[#111d38]/90 to-[#0b1326]/90 border border-slate-700/60 hover:border-cyan-500/40 rounded-2xl p-3.5 shadow-[0_0_20px_rgba(0,180,255,0.06)] transition-all flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Server Telemetry</p>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <span className="text-[11px] font-mono font-bold text-emerald-400">CPU Load: 14.2%</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5,6].map(i => (
                        <div key={i} className={'w-1.5 h-3 rounded-sm ' + (i <= 3 ? 'bg-emerald-400 animate-pulse shadow-[0_0_4px_#10b981]' : 'bg-slate-700')}></div>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] font-mono text-cyan-400 font-bold mt-1">Active Rules: 38 Rules</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>

            </div>

            {/* ── MAIN SECURITY LOG TERMINAL (Full Width & Height) ── */}
            <div className="flex-1 flex flex-col min-h-0 p-5 bg-[#050912]">
              
              <div className="flex-1 flex flex-col min-h-0 bg-[#091122]/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
                
                {/* Log Terminal Header with Severity Filters */}
                <div className="px-5 py-3 bg-[#0d162d] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_6px_#f43f5e]"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_6px_#f97316]"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_6px_#10b981]"></div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-200 tracking-wider">KPK4444 // LIVE SECURITY INCIDENT INTELLIGENCE FEED</span>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center space-x-2 text-[10px] font-mono">
                    <span className="text-slate-400 font-sans mr-1 font-bold">Severity Filter:</span>
                    {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(f => (
                      <button
                        key={f}
                        onClick={() => setFilterLogs(f)}
                        className={'px-3.5 py-1 rounded-lg font-bold transition-all duration-200 ' + (filterLogs === f ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60')}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Log Feed List (Full height scrollable) */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar">
                  {filteredLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                      <div className="w-14 h-14 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mb-3">
                        <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-slate-300">No Security Events Found</p>
                      <p className="text-xs text-slate-500 mt-1">No matching threat logs recorded for domain under filter [{filterLogs}].</p>
                    </div>
                  ) : filteredLogs.map((l) => (
                    <div key={l._id} className="bg-[#0c1429]/90 border border-slate-800/90 hover:border-cyan-500/40 rounded-xl p-4 transition duration-200 space-y-3 shadow-md hover:shadow-[0_0_15px_rgba(0,180,255,0.06)]">
                      
                      {/* Log Badge Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div className="flex items-center space-x-2.5">
                          <span className={'px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ' + (
                            l.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]' :
                            l.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_8px_rgba(249,115,22,0.2)]' :
                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                          )}>
                            {l.severity}
                          </span>
                          <span className="text-xs font-bold text-slate-200">{l.category}</span>
                        </div>

                        <div className="flex items-center space-x-3 text-xs font-mono">
                          <span className="text-slate-400">{new Date(l.timestamp).toLocaleString()}</span>
                          <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold shadow-[0_0_8px_rgba(6,182,212,0.1)]">
                            IP: {l.ipAddress}
                          </span>
                        </div>
                      </div>

                      {/* Snippet / Code Payload Box */}
                      {l.snippet && (
                        <div className="bg-[#040812] border border-slate-800/90 rounded-xl p-3 font-mono text-xs overflow-x-auto relative group">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-sans font-bold flex items-center justify-between">
                            <span>Attack Payload Snippet</span>
                            <span className="text-rose-400 font-mono">MALICIOUS_CODE_DETECTED</span>
                          </div>
                          <code className="text-rose-300 break-all leading-relaxed">{l.snippet}</code>
                        </div>
                      )}

                      {/* User Agent */}
                      {l.userAgent && (
                        <div className="text-[11px] font-mono text-slate-500 truncate">
                          <span className="text-slate-600 font-sans font-bold">User-Agent:</span> {l.userAgent}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

              </div>

            </div>

          </div>
        );
      })()}





      {/* ── NEW KEY TUTORIAL POPUP ── */}
      {showKeyTutorial && newKeyData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050914]/80 backdrop-blur-xl animate-fade-in">
          <div className="relative bg-[#0c1427]/95 border border-slate-700/80 rounded-3xl shadow-[0_0_80px_rgba(0,180,255,0.15)] max-w-6xl w-full mx-auto overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#091020]/90 backdrop-blur-md">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <span>System Secured & License Generated</span>
                    <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full uppercase">OJS {selectedOjsVersion}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono tracking-wider mt-0.5">KPK4444 SHIELD INTEGRATION ASSISTANT</p>
                </div>
              </div>
              <button 
                onClick={() => {setShowKeyTutorial(false); setNewKeyData(null);}} 
                className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700/60 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Modal Body: 2 Columns Side-by-Side */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 custom-scrollbar">
              
              {/* Left Column (5 Cols): API Key & Quick Action */}
              <div className="lg:col-span-5 flex flex-col space-y-5 justify-between">
                
                {/* Secret Key Card */}
                <div className="bg-[#111c35]/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg space-y-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Your Secret API Key</span>
                    <span className="text-emerald-400 font-mono font-bold">READY</span>
                  </p>
                  <div className="bg-[#060b17] p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <code className="text-emerald-400 font-mono text-xs break-all leading-relaxed font-bold">{newKeyData.apiKey}</code>
                    <button 
                      onClick={handleCopyKey} 
                      className={'px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shrink-0 flex items-center space-x-1.5 ' + (copiedKey ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700')}
                    >
                      {copiedKey ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          <span>Copy Key</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 1-Click Download Button */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1328] to-[#080d1c] border border-cyan-500/20 hover:border-cyan-400/50 rounded-2xl p-5 shadow-[0_0_25px_rgba(0,150,255,0.08)] space-y-4 transition-all duration-300 group/dl">
                  
                  {/* Decorative background glow */}
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover/dl:bg-cyan-500/20 transition-all duration-500"></div>

                  <div className="flex items-center space-x-4 relative z-10">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 border border-cyan-300/40 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover/dl:scale-110 transition-transform duration-300">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </div>
                    <div>
                      <h4 className="text-[13px] font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100 tracking-wide drop-shadow-sm">INSTANT INSTALLATION FILE</h4>
                      <p className="text-[10px] text-cyan-200/60 font-mono mt-0.5">Pre-configured index.php ready to upload</p>
                    </div>
                  </div>

                  <button 
                    onClick={downloadIndexPhp} 
                    className={'relative overflow-hidden w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-2.5 z-10 ' + (downloaded ? 'bg-emerald-500 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-[1.02]' : 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white border border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] hover:scale-[1.02] group/btn')}
                  >
                    {/* Shimmer Effect */}
                    {!downloaded && <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:translate-x-[150%] transition-transform duration-1000 skew-x-12"></div>}
                    
                    {downloaded ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        <span>index.php Downloaded!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>Download index.php</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Steps Guide */}
                <div className="bg-[#111c35]/90 border border-slate-700/80 rounded-2xl p-4 space-y-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">3-Step Quick Guide</p>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                      <p className="text-[11px] leading-relaxed">Download or copy the pre-configured <code className="text-cyan-300 font-mono">index.php</code> file.</p>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                      <p className="text-[11px] leading-relaxed">Upload and replace <code className="text-cyan-300 font-mono">index.php</code> in your OJS root folder.</p>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                      <p className="text-[11px] leading-relaxed">KPK4444 Security Shield is active instantly!</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column (7 Cols): Code Editor View */}
              <div className="lg:col-span-7 flex flex-col bg-[#060b17] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl min-w-0">
                
                {/* Code Terminal Header */}
                <div className="px-4 py-3 bg-[#0d162a] border-b border-slate-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-200">index.php — OJS {selectedOjsVersion} Protection Code</span>
                  </div>

                  <button 
                    onClick={handleCopyCode} 
                    className={'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center space-x-1.5 ' + (copiedCode ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700')}
                  >
                    {copiedCode ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        <span>Full Code Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        <span>Copy Full Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Code Body */}
                <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar">
                  <pre className="text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                    <code>
                      {selectedOjsVersion === '3.3' ? getFullIndexPhp(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL) : getFullIndexPhp34(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL)}
                    </code>
                  </pre>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
      {/* Bottom nav (mobile only) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-slate-300/90 dark:bg-[#1e2640]/70 backdrop-blur border-t border-slate-200 dark:border-white/10 flex lg:hidden">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest transition-colors ${tab === t ? 'text-blue-400' : 'text-indigo-500/70 dark:text-gray-500 hover:text-slate-900 dark:text-gray-300'}`}
          >
            {t.split(' ')[0]}
          </button>
        ))}
      </nav>

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .animate-in { animation: fadeInUp .3s ease-out forwards; }
        /* Add bottom padding on mobile for bottom nav */
        @media (max-width: 1023px) { main { padding-bottom: 56px; } }
      `}</style>
      {/* ── CONFIRM MODAL ── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-300/90 dark:bg-[#1e2640]/70 backdrop-blur-sm" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}></div>
          <div className="relative bg-slate-800/80 dark:bg-[#1e2640]/90 backdrop-blur-3xl border border-slate-300 dark:border-white/10 rounded-3xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] max-w-sm w-full mx-auto transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(225,29,72,0.1)]">
                <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-black text-indigo-900 dark:text-white mb-2 tracking-tight">{confirmModal.title}</h3>
              <p className="text-xs text-indigo-600/80 dark:text-gray-400 mb-8 leading-relaxed px-4">{confirmModal.message}</p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                  className="flex-1 py-3.5 bg-indigo-100 dark:bg-[#1e2640]/50 hover:bg-indigo-200 dark:bg-white/10 text-slate-900 dark:text-gray-300 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border border-slate-200 dark:border-white/10"
                >
                  Batal
                </button>
                <button 
                  onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); }} 
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-indigo-900 dark:text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border border-rose-500/50"
                >
                  Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

