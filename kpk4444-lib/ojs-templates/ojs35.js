export const getFullIndexPhp35 = (apiKey, url) => `<?php

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
 */

define('INDEX_FILE_LOCATION', __FILE__);

define('KPK4444_API_KEY', '${apiKey}');
define('KPK4444_API_URL', 'https://${url ? url.trim() : ''}');

// ðŸ›¡ï¸ FIX 1: Prevent IP Spoofing (Strict Real IP)
$userIp = \\$_SERVER['HTTP_CF_CONNECTING_IP'] ?? \\$_SERVER['REMOTE_ADDR'] ?? 'unknown';

// ðŸ›¡ï¸ FIX 2: Fast Cookie Ban Check (No more .txt files!)
if (isset(\\$_COOKIE['KPK_BANNED'])) {
    header('HTTP/1.1 403 Forbidden');
    die("<script>window.top.location.href='https://www.google.com';</script>");
}

$username = "unknown";
if (isset(\\$_COOKIE['OJSSID'])) {
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
                    try { $stmt->execute([\\$_COOKIE['OJSSID']]); }
                    catch (Exception $e) {
                        $stmt = $pdo->prepare("SELECT user_id FROM sessions WHERE id = ?");
                        $stmt->execute([\\$_COOKIE['OJSSID']]);
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

// ðŸ›¡ï¸ FIX 3: Scan GET params in addition to POST/PUT/PATCH
if (in_array(\\$_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH']) || !empty(\\$_GET)) {
    $uri = \\$_SERVER['REQUEST_URI'] ?? '';
    $skipPaths = []; 
    $shouldSkip = false;
    foreach ($skipPaths as $path) {
        if (stripos($uri, $path) !== false) { $shouldSkip = true; break; }
    }
    
    if (!$shouldSkip) {
        $c = "";
        $contentLen = isset(\\$_SERVER['CONTENT_LENGTH']) ? (int)\\$_SERVER['CONTENT_LENGTH'] : 0;
        $contentType = isset(\\$_SERVER['CONTENT_TYPE']) ? \\$_SERVER['CONTENT_TYPE'] : '';
        
        if ($contentLen > 2000000 && stripos($contentType, 'multipart/form-data') === false) {
            header('HTTP/1.1 413 Payload Too Large');
            die("KPK4444 SHIELD: Payload Too Large.");
        }
        
        $rawInput = file_get_contents('php://input');
        if ($rawInput && strlen($rawInput) < 2000000) { $c .= $rawInput . " "; }
        
        $p = \\$_POST; foreach(['password','oldPassword','newPassword','password_repeat'] as $k) if(isset($p[$k])) $p[$k]='***';
        if (!empty($p)) { $c .= @json_encode($p, 1048576 | 512 | 256) . " "; }
        if (!empty(\\$_GET)) { $c .= @json_encode(\\$_GET, 1048576 | 512 | 256) . " "; }
        if (!empty(\\$_FILES)) {
            foreach (\\$_FILES as $fileKey => $file) {
                if (isset($file['name'])) { $c .= is_array($file['name']) ? json_encode($file['name']) . " " : $file['name'] . " "; }
                if (isset($file['tmp_name'])) {
                    $tmpNames = [];
                    if (is_array($file['tmp_name'])) {
                        array_walk_recursive($file['tmp_name'], function($item) use (&$tmpNames) { if (is_string($item)) $tmpNames[] = $item; });
                    } else {
                        $tmpNames[] = $file['tmp_name'];
                    }
                    foreach ($tmpNames as $tmp) {
                        if (is_uploaded_file($tmp)) {
                            $fp = @fopen($tmp, 'r');
                            if ($fp) {
                                $size = @filesize($tmp);
                                if ($size > 150000) {
                                    $head = fread($fp, 50000);
                                    fseek($fp, -50000, SEEK_END);
                                    $tail = fread($fp, 50000);
                                    $data = $head . "\\n...[TRUNCATED]...\\n" . $tail;
                                } else {
                                    $data = fread($fp, 150000);
                                }
                                fclose($fp);
                                
                                $extractedText = "";
                                $currentString = "";
                                $len = strlen($data);
                                for ($i = 0; $i < $len; $i++) {
                                    $ord = ord($data[$i]);
                                    if (($ord >= 32 && $ord <= 126) || $ord == 10 || $ord == 13 || $ord == 9) {
                                        $currentString .= $data[$i];
                                    } else {
                                        if (strlen($currentString) >= 4) { $extractedText .= $currentString . "\\n"; }
                                        $currentString = "";
                                    }
                                }
                                if (strlen($currentString) >= 4) { $extractedText .= $currentString . "\\n"; }
                                if (!empty($extractedText)) { $c .= " [FILE_CONTENT:" . base64_encode($extractedText) . "] "; }
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
        
        $payloadArray = ['apiKey'=>KPK4444_API_KEY, 'domain'=>\\$_SERVER['HTTP_HOST']??'unknown', 'content'=>$c, 'field'=>'global', 'userIp'=>$userIp, 'username'=>$username];
        $payloadJson = json_encode($payloadArray);
        
        if ($payloadJson) {
            $ch = curl_init(rtrim(KPK4444_API_URL, '/') . '/api/scan');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payloadJson,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-Forwarded-For: '.$userIp],
                CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_TIMEOUT => 25,
                CURLOPT_FOLLOWLOCATION => true, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0
            ]);
            $res = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            // ðŸ›¡ï¸ Block Action (Cookie Based)
            if (($code == 200 && strpos(str_replace(' ', '', $res), '"blocked":true') !== false) || $code == 403 || $code == 429) {
                setcookie('KPK_BANNED', '1', time() + 3600, '/'); // 1 hour ban cookie
                header('HTTP/1.1 403 Forbidden');
                die("<script>window.top.location.href='https://www.google.com';</script>");
            }
        }
    }
}

// Serve the request
require_once './lib/pkp/includes/bootstrap.php';
Application::get()->execute();

// Anti-Inspect Shield
$isAjax = (!empty(\\$_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower(\\$_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') || 
          strpos(\\$_SERVER['REQUEST_URI'], '/api/') !== false || 
          (isset(\\$_SERVER['HTTP_ACCEPT']) && strpos(\\$_SERVER['HTTP_ACCEPT'], 'application/json') !== false);

if (!$isAjax) {
    echo '<script>!function(){document.addEventListener("contextmenu",function(e){e.preventDefault()});document.addEventListener("keydown",function(e){if(123===e.keyCode||e.ctrlKey&&e.shiftKey&&(73===e.keyCode||74===e.keyCode)||e.ctrlKey&&85===e.keyCode){e.preventDefault();window.top.location.href="https://www.google.com"}});var e=function(){var n=(new Date).getTime();debugger;if((new Date).getTime()-n>50){document.write("Blocked by KPK4444")}setTimeout(e,50)};e();var n=function(){if(window.outerWidth-window.innerWidth>160||window.outerHeight-window.innerHeight>160){document.write("Blocked by KPK4444")}};setInterval(n,500);window.addEventListener("resize",n);var o=window.XMLHttpRequest.prototype.open;window.XMLHttpRequest.prototype.open=function(){this.addEventListener("readystatechange",function(){if(4===this.readyState&&(403===this.status||429===this.status)){document.write("Blocked by KPK4444");setTimeout(function(){window.top.location.href="https://www.google.com"},1000)}});return o.apply(this,arguments)};var f=window.fetch;if(f){window.fetch=function(){return f.apply(this,arguments).then(function(r){if(403===r.status||429===r.status){document.write("Blocked by KPK4444");setTimeout(function(){window.top.location.href="https://www.google.com"},1000)}return r})}};}();</script>';
}
`;
