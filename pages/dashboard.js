import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

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
        $p = json_encode(['apiKey'=>KPK4444_API_KEY, 'domain'=>$_SERVER['HTTP_HOST']??'unknown', 'content'=>$c, 'field'=>'global']);
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
                header('HTTP/1.1 403 Forbidden');
                header('Content-Type: application/json'); 
                exit(json_encode(['error' => '403 Forbidden']));
            } elseif ($code == 403 || $code == 429) {
                header('HTTP/1.1 403 Forbidden');
                header('Content-Type: application/json'); 
                exit(json_encode(['error' => '403 Forbidden']));
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
        $s = '<script>!function(){document.addEventListener("contextmenu",function(e){e.preventDefault()});document.addEventListener("keydown",function(e){if(123===e.keyCode||e.ctrlKey&&e.shiftKey&&(73===e.keyCode||74===e.keyCode)||e.ctrlKey&&85===e.keyCode){e.preventDefault();window.location.href="https://www.google.com"}});var e=function(){var n=(new Date).getTime();debugger;if((new Date).getTime()-n>50){document.documentElement.innerHTML="<h1>KPK4444 SECURITY SHIELD: DEVTOOLS DETECTED</h1>";window.location.href="https://www.google.com"}setTimeout(e,50)};e();var n=function(){if(window.outerWidth-window.innerWidth>160||window.outerHeight-window.innerHeight>160){document.documentElement.innerHTML="<h1>KPK4444 SECURITY SHIELD: DEVTOOLS DETECTED</h1>";window.location.href="https://www.google.com"}};setInterval(n,500);window.addEventListener("resize",n)}();</script>';
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
        $p = json_encode(['apiKey'=>KPK4444_API_KEY, 'domain'=>$_SERVER['HTTP_HOST']??'unknown', 'content'=>$c, 'field'=>'global']);
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
                header('HTTP/1.1 403 Forbidden');
                header('Content-Type: application/json'); 
                exit(json_encode(['error' => '403 Forbidden']));
            } elseif ($code == 403 || $code == 429) {
                header('HTTP/1.1 403 Forbidden');
                header('Content-Type: application/json'); 
                exit(json_encode(['error' => '403 Forbidden']));
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
        $s = '<script>!function(){document.addEventListener("contextmenu",function(e){e.preventDefault()});document.addEventListener("keydown",function(e){if(123===e.keyCode||e.ctrlKey&&e.shiftKey&&(73===e.keyCode||74===e.keyCode)||e.ctrlKey&&85===e.keyCode){e.preventDefault();window.location.href="https://www.google.com"}});var e=function(){var n=(new Date).getTime();debugger;if((new Date).getTime()-n>50){document.documentElement.innerHTML="<h1>KPK4444 SECURITY SHIELD: DEVTOOLS DETECTED</h1>";window.location.href="https://www.google.com"}setTimeout(e,50)};e();var n=function(){if(window.outerWidth-window.innerWidth>160||window.outerHeight-window.innerHeight>160){document.documentElement.innerHTML="<h1>KPK4444 SECURITY SHIELD: DEVTOOLS DETECTED</h1>";window.location.href="https://www.google.com"}};setInterval(n,500);window.addEventListener("resize",n)}();</script>';
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

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkTheme]);

  const aiPollRef = useRef(null);
  const countdownRef = useRef(null);

  const downloadIndexPhp = () => {
    if (!newKeyData) return;
    const content = selectedOjsVersion === '3.3' 
      ? getFullIndexPhp(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL) 
      : getFullIndexPhp34(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL);
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
    const content = selectedOjsVersion === '3.3' 
      ? getFullIndexPhp(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL) 
      : getFullIndexPhp34(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL);
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
        await fetch('/api/unban', { method: 'POST', headers: { 'Authorization': `Bearer ${jwtToken}` } });
        loadData(jwtToken, false);
      }
    });
  };

  const unbanIp = (ip) => {
    setConfirmModal({
      isOpen: true, title: 'Unban IP', message: `Unban IP ${ip}?`,
      onConfirm: async () => {
        await fetch(`/api/banned-ips?ip=${ip}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${jwtToken}` } });
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
  if (!auth) return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black flex items-center justify-center p-4">
      <Head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <title>KPK4444 — Admin Login</title>
        <style>{`* { font-family: 'Outfit', sans-serif; }`}</style>
      </Head>
      <div className="w-full max-w-xs sm:max-w-sm">
        <form onSubmit={login} className="bg-slate-400/20 dark:bg-white/5 backdrop-blur-xl border border-slate-400/60 dark:border-white/10 p-7 sm:p-9 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center mb-7">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/10 mb-4 shadow-xl shadow-black/50">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 dark:from-white to-blue-400 dark:to-gray-400 tracking-tight">KPK4444</h2>

            </div>
            <p className="text-[10px] text-slate-700 dark:text-gray-500 uppercase tracking-widest font-semibold mt-1">by.150141146151172150</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-slate-800 dark:text-gray-400 mb-1.5 block uppercase tracking-widest">Master Secret</label>
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-[#9ca3af]/50 dark:bg-black/30 text-slate-900 dark:text-white border border-slate-400/60 dark:border-white/10 px-4 py-3 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder-gray-600"
              />
            </div>
            <div className="flex justify-center my-4">
              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={(token) => setRecaptchaToken(token)}
                theme="dark"
              />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white py-3 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 uppercase tracking-widest">
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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkTheme ? 'dark' : ''}`}>
      <div className="min-h-screen bg-transparent dark:bg-[#09090b] text-slate-900 dark:text-gray-300 text-[13px]">
        <Head>
          <script src="https://cdn.tailwindcss.com"></script>
          <script dangerouslySetInnerHTML={{__html: `
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
            body { background: linear-gradient(135deg, #a9a9a9 0%, #94a3b8 50%, #7dd3fc 100%); background-attachment: fixed; transition: background 0.3s; }
            html.dark body { background-image: radial-gradient(circle at 50% 0%, #1e293b 0%, #09090b 100%); background-color: #09090b; }
            ::-webkit-scrollbar { width: 5px; height: 5px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
            html.dark ::-webkit-scrollbar-thumb { background: #27272a; }
            select option { background: #f1f5f9; color: #0f172a; }
            html.dark select option { background: #09090b; color: white; }
          `}</style>
        </Head>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-300/90 dark:bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-screen overflow-hidden">

        {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
        <aside className={`
          fixed lg:relative inset-y-0 left-0 z-40
          w-60 bg-[#a9a9a9]/60 dark:bg-black/40 backdrop-blur-3xl border-r border-slate-300 dark:border-white/5
          flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Brand */}
          <div className="p-5 pb-3 flex items-center space-x-3 border-b border-slate-300 dark:border-white/5">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0 shadow-md">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 dark:from-white to-blue-400 dark:to-gray-400 leading-none">KPK4444</h1>

              </div>
              <p className="text-[9px] text-slate-700 dark:text-gray-500 tracking-widest uppercase">by.150141146151172150</p>
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
                    ? 'bg-slate-400/30 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-300 dark:border-white/5 shadow'
                    : 'text-slate-800 dark:text-gray-400 hover:bg-slate-400/20 dark:bg-white/5 hover:text-slate-800 dark:text-gray-200'
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-3 flex-shrink-0 transition-all
                  ${tab === t ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-transparent group-hover:bg-gray-600'}`}
                />
                {t}
              </button>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-300 dark:border-white/5 space-y-3">
            <button
              onClick={() => { sessionStorage.clear(); window.location.reload(); }}
              className="w-full text-center py-2.5 rounded-lg text-[11px] font-bold text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-400 transition uppercase tracking-widest"
            >
              Terminate Session
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto flex flex-col min-w-0">

          {/* Top bar (visible on mobile) */}
          <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#9ca3af]/50 dark:bg-black/30 backdrop-blur border-b border-slate-300 dark:border-white/5 lg:hidden">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 dark:from-white to-blue-400 dark:to-gray-400">KPK4444</span>

              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-slate-400/20 dark:bg-white/5 border border-slate-400/60 dark:border-white/10 text-slate-900 dark:text-gray-300 hover:text-slate-900 dark:text-white transition"
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
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {tab === 'OVERVIEW' ? 'Command Center' : tab}
                </h2>
                <p className="text-slate-800 dark:text-gray-400 text-xs mt-0.5">Real-time threat monitoring</p>
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
                  <p className="text-slate-700 dark:text-gray-500 text-[10px] mt-2">Kemungkinan penyebab: MongoDB URI salah, nama database tidak ada, atau env variable Vercel belum di-redeploy.</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {statsCards.map((s, i) => (
                    <div key={i} className="bg-[#a9a9a9]/40 dark:bg-black/20 backdrop-blur-xl p-5 rounded-xl border border-slate-300 dark:border-white/5 hover:border-slate-400/60 dark:border-white/10 transition">
                      <p className="text-slate-800 dark:text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-2">{s.title}</p>
                      <p className={`text-3xl font-bold tracking-tighter ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#a9a9a9]/40 dark:bg-black/20 backdrop-blur-xl rounded-xl border border-slate-300 dark:border-white/5 p-5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Recent Threat Detections</h3>
                  {logs.length === 0 ? (
                    <p className="text-center py-8 text-slate-700 dark:text-gray-500 text-sm">No recent threats detected.</p>
                  ) : (
                    <div className="space-y-2">
                      {logs.slice(0, 5).map(l => (
                        <div key={l._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-slate-400/10 dark:bg-white/[0.02] border border-slate-300 dark:border-white/5 hover:bg-slate-400/20 dark:bg-white/5 transition">
                          <div className="flex items-center space-x-3">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${l.severity === 'CRITICAL' ? 'bg-rose-500' : l.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-white">{l.domain}</p>
                              <p className="text-[10px] text-slate-700 dark:text-gray-500 font-mono mt-0.5">{new Date(l.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-5 sm:ml-0">
                            <span className="font-mono text-[10px] text-slate-800 dark:text-gray-400 bg-[#a9a9a9]/60 dark:bg-black/40 px-2 py-0.5 rounded border border-slate-300 dark:border-white/5 truncate max-w-[120px]">{l.ipAddress}</span>
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
                <form onSubmit={createKey} className="bg-[#a9a9a9]/40 dark:bg-black/20 backdrop-blur-xl p-5 rounded-xl border border-slate-300 dark:border-white/5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="sm:col-span-1">
                      <label className="text-[10px] text-slate-800 dark:text-gray-400 mb-1.5 block uppercase tracking-widest">Target Domain</label>
                      <input name="domain" placeholder="jurnal.ac.id" required className="w-full bg-[#a9a9a9]/60 dark:bg-black/40 border border-slate-400/60 dark:border-white/10 px-3 py-2.5 rounded-lg text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition text-xs" />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-[10px] text-slate-800 dark:text-gray-400 mb-1.5 block uppercase tracking-widest">Owner / Institute</label>
                      <input name="ownerName" placeholder="Owner Name" required className="w-full bg-[#a9a9a9]/60 dark:bg-black/40 border border-slate-400/60 dark:border-white/10 px-3 py-2.5 rounded-lg text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-800 dark:text-gray-400 mb-1.5 block uppercase tracking-widest">OJS Version</label>
                      <select name="ojsVersion" defaultValue="3.3" className="w-full bg-[#a9a9a9]/60 dark:bg-black/40 border border-slate-400/60 dark:border-white/10 px-3 py-2.5 rounded-lg text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition appearance-none cursor-pointer text-xs">
                        <option value="3.3">OJS 3.3</option>
                        <option value="3.4">OJS 3.4</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-800 dark:text-gray-400 mb-1.5 block uppercase tracking-widest">Valid Duration</label>
                      <select name="validDays" defaultValue="365" className="w-full bg-[#a9a9a9]/60 dark:bg-black/40 border border-slate-400/60 dark:border-white/10 px-3 py-2.5 rounded-lg text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition appearance-none cursor-pointer text-xs">
                        <option value="30">1 Bulan</option>
                        <option value="90">3 Bulan</option>
                        <option value="180">6 Bulan</option>
                        <option value="365">1 Tahun</option>
                        <option value="730">2 Tahun</option>
                        <option value="36500">Lifetime</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button type="submit" disabled={isGeneratingKey} className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg text-slate-900 dark:text-white font-bold shadow-lg shadow-blue-500/20 transition text-xs uppercase tracking-widest disabled:opacity-80 flex items-center justify-center">
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
                    <div key={k._id} className="bg-[#a9a9a9]/40 dark:bg-black/20 border border-slate-300 dark:border-white/5 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{k.domain}</p>
                            {k.ojsVersion && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border border-blue-500/30 shadow-sm shadow-blue-500/10">V{k.ojsVersion}</span>}
                          </div>
                          <p className="text-[10px] text-slate-700 dark:text-gray-500">{k.ownerName}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${k.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{k.status.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-[#a9a9a9]/60 dark:bg-black/40 px-2.5 py-1.5 rounded border border-slate-300 dark:border-white/5 cursor-pointer hover:border-emerald-500/30 transition" onClick={() => navigator.clipboard.writeText(k.apiKey)}>
                        <code className="text-emerald-400 font-mono text-[11px] truncate flex-1">{k.apiKey.substring(0, 24)}...</code>
                        <span className="text-[9px] text-slate-700 dark:text-gray-500 font-bold uppercase tracking-widest">COPY</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-700 dark:text-gray-500">
                        <span>{k.requestCount.toLocaleString()} requests</span>
                        <span>Expires: {new Date(k.expiredAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <button onClick={() => { setNewKeyData(k); if (k.ojsVersion) setSelectedOjsVersion(k.ojsVersion); setShowKeyTutorial(true); }} className="flex-1 bg-sky-500/10 hover:bg-sky-500/20 py-1.5 rounded text-[10px] font-bold text-sky-400 uppercase tracking-widest transition border border-sky-500/20">View Code</button>
                        <button onClick={() => setViewKeyLogs(k.domain)} className="flex-1 bg-slate-400/20 dark:bg-white/5 hover:bg-slate-400/30 dark:bg-white/10 py-1.5 rounded text-[10px] font-bold text-slate-900 dark:text-gray-300 uppercase tracking-widest transition border border-slate-300 dark:border-white/5">View Logs</button>
                        <button onClick={() => deleteKey(k._id)} className="px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition border border-rose-500/20">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden sm:block bg-[#a9a9a9]/40 dark:bg-black/20 backdrop-blur-xl rounded-xl border border-slate-300 dark:border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#a9a9a9]/60 dark:bg-black/40 text-slate-800 dark:text-gray-400 border-b border-slate-300 dark:border-white/5 text-[10px] font-semibold uppercase tracking-widest">
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
                          <tr key={k._id} className="hover:bg-slate-400/10 dark:bg-white/[0.02] transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 dark:text-white">{k.domain}</p>
                                {k.ojsVersion && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border border-blue-500/30 shadow-sm shadow-blue-500/10">V{k.ojsVersion}</span>}
                              </div>
                              <p className="text-[10px] text-slate-700 dark:text-gray-500 mt-0.5">{k.ownerName}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="inline-flex items-center space-x-2 bg-[#a9a9a9]/60 dark:bg-black/40 px-2.5 py-1 rounded border border-slate-300 dark:border-white/5 cursor-pointer hover:border-emerald-500/30 transition" onClick={() => navigator.clipboard.writeText(k.apiKey)}>
                                <code className="text-emerald-400 font-mono text-[11px]">{k.apiKey.substring(0, 16)}...</code>
                                <span className="text-[9px] text-slate-700 dark:text-gray-500 group-hover:text-slate-900 dark:text-white font-bold uppercase tracking-widest">COPY</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${k.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : k.status === 'suspended' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-gray-500/10 text-slate-800 dark:text-gray-400 border-gray-500/20'}`}>{k.status.toUpperCase()}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-900 dark:text-gray-300 font-mono text-[11px]">{k.requestCount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-800 dark:text-gray-400 text-[11px]">{new Date(k.expiredAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <button onClick={() => { setNewKeyData(k); if (k.ojsVersion) setSelectedOjsVersion(k.ojsVersion); setShowKeyTutorial(true); }} className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 rounded text-[10px] font-bold text-sky-400 uppercase tracking-widest transition border border-sky-500/20">View Code</button>
                              <button onClick={() => setViewKeyLogs(k.domain)} className="px-3 py-1.5 bg-slate-400/20 dark:bg-white/5 hover:bg-slate-400/30 dark:bg-white/10 rounded text-[10px] font-bold text-slate-900 dark:text-gray-300 uppercase tracking-widest transition border border-slate-300 dark:border-white/5">View Logs</button>
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
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold border cursor-pointer uppercase tracking-wider transition ${filterLogs === 'ALL' ? 'bg-slate-400/30 dark:bg-white/10 text-slate-900 dark:text-white border-white/20' : 'bg-slate-400/20 dark:bg-white/5 text-slate-800 dark:text-gray-400 border-slate-300 dark:border-white/5 hover:bg-slate-400/30 dark:bg-white/10'}`}
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
                    <div key={l._id} className="bg-[#a9a9a9]/40 dark:bg-black/20 border border-slate-300 dark:border-white/5 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{l.domain}</p>
                        <div className="flex items-center space-x-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${l.severity === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : l.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                          <span className={`text-[10px] font-bold ${l.severity === 'CRITICAL' ? 'text-rose-400' : l.severity === 'HIGH' ? 'text-orange-400' : 'text-yellow-400'}`}>{l.severity}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-800 dark:text-gray-400 font-bold uppercase tracking-wide">{l.category}</p>
                      <div className="flex justify-between text-[10px] text-slate-700 dark:text-gray-500">
                        <span className="font-mono">{l.ipAddress}</span>
                        <span>{new Date(l.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block bg-[#a9a9a9]/40 dark:bg-black/20 backdrop-blur-xl rounded-xl border border-slate-300 dark:border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#a9a9a9]/60 dark:bg-black/40 text-slate-800 dark:text-gray-400 border-b border-slate-300 dark:border-white/5 text-[10px] font-semibold uppercase tracking-widest">
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
                          <tr key={l._id} className="hover:bg-slate-400/10 dark:bg-white/[0.02] transition">
                            <td className="px-4 py-3 font-mono text-slate-800 dark:text-gray-400 text-[10px]">{new Date(l.timestamp).toLocaleString()}</td>
                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{l.domain}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${l.severity === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : l.severity === 'HIGH' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-yellow-500'}`} />
                                <span className={`text-[10px] font-bold ${l.severity === 'CRITICAL' ? 'text-rose-400' : l.severity === 'HIGH' ? 'text-orange-400' : 'text-yellow-400'}`}>{l.severity}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-900 dark:text-gray-300 text-[11px]">{l.category}</td>
                            <td className="px-4 py-3"><span className="font-mono text-slate-800 dark:text-gray-400 bg-[#a9a9a9]/60 dark:bg-black/40 px-2 py-0.5 rounded border border-slate-300 dark:border-white/5 text-[10px]">{l.ipAddress}</span></td>
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
                    <div key={b._id} className="bg-[#a9a9a9]/40 dark:bg-black/20 border border-slate-300 dark:border-white/5 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <code className="text-rose-400 font-mono text-xs">{b.value}</code>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${b.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>{b.severity}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="px-2 py-0.5 bg-slate-400/20 dark:bg-white/5 rounded text-slate-800 dark:text-gray-400 border border-slate-300 dark:border-white/5 uppercase font-semibold">{b.type}</span>
                        <span className="text-slate-800 dark:text-gray-400">{b.category}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-300 dark:border-white/5 mt-2">
                        <div className="text-[10px] text-slate-700 dark:text-gray-500 flex items-center">
                          <span className="mr-1">Added by:</span>
                          <span className={b.addedBy === 'AI_AUTO_LEARNING' ? 'text-emerald-400 font-bold' : 'text-slate-800 dark:text-gray-400'}>{b.addedBy}</span>
                        </div>
                        <button onClick={() => deleteBlacklist(b._id)} className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-[9px] font-bold uppercase tracking-widest border border-rose-500/20 transition">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block bg-[#a9a9a9]/40 dark:bg-black/20 backdrop-blur-xl rounded-xl border border-slate-300 dark:border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#a9a9a9]/60 dark:bg-black/40 text-slate-800 dark:text-gray-400 border-b border-slate-300 dark:border-white/5 text-[10px] font-semibold uppercase tracking-widest">
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
                          <tr key={b._id} className="hover:bg-slate-400/10 dark:bg-white/[0.02] transition">
                            <td className="px-4 py-3 text-slate-800 dark:text-gray-400"><span className="px-2 py-0.5 bg-slate-400/20 dark:bg-white/5 rounded text-[10px] font-semibold uppercase border border-slate-300 dark:border-white/5">{b.type}</span></td>
                            <td className="px-4 py-3 font-mono text-rose-400 text-[11px]">{b.value}</td>
                            <td className="px-4 py-3 text-slate-900 dark:text-gray-300 text-[11px]">{b.category}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${b.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>{b.severity}</span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <span className={`text-[10px] font-mono border px-2 py-0.5 rounded ${b.addedBy === 'AI_AUTO_LEARNING' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold' : 'bg-slate-400/20 dark:bg-white/5 border-slate-400/60 dark:border-white/10 text-slate-800 dark:text-gray-400'}`}>{b.addedBy}</span>
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
                    <p className="text-[10px] text-slate-700 dark:text-gray-500 font-mono">Showing {(blacklistPage - 1) * 15 + 1} to {Math.min(blacklistPage * 15, blacklists.length)} of {blacklists.length}</p>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setBlacklistPage(p => Math.max(1, p - 1))}
                        disabled={blacklistPage === 1}
                        className="px-3 py-1.5 bg-slate-400/20 dark:bg-white/5 hover:bg-slate-400/30 dark:bg-white/10 disabled:opacity-50 disabled:hover:bg-slate-400/20 dark:bg-white/5 border border-slate-400/60 dark:border-white/10 rounded text-[10px] font-bold text-slate-900 dark:text-gray-300 uppercase tracking-widest transition"
                      >
                        Prev
                      </button>
                      <button 
                        onClick={() => setBlacklistPage(p => p + 1)}
                        disabled={blacklistPage * 15 >= blacklists.length}
                        className="px-3 py-1.5 bg-slate-400/20 dark:bg-white/5 hover:bg-slate-400/30 dark:bg-white/10 disabled:opacity-50 disabled:hover:bg-slate-400/20 dark:bg-white/5 border border-slate-400/60 dark:border-white/10 rounded text-[10px] font-bold text-slate-900 dark:text-gray-300 uppercase tracking-widest transition"
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
                <div className="bg-[#a9a9a9]/60 dark:bg-black/40 border border-slate-300 dark:border-white/5 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">AI Scanner Configuration</h3>
                      <p className="text-sm text-slate-800 dark:text-gray-400">by.150141146151172150.</p>
                    </div>
                  </div>

                  <form onSubmit={createGroqKey} className="flex flex-col sm:flex-row gap-4 mb-8">
                    <input name="groqKey" required placeholder="gsk_xxxxxxxxxxxxxxxxxxxx" className="flex-1 bg-slate-200 dark:bg-[#0f172a] border border-slate-400/60 dark:border-white/10 p-3 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-bold rounded-lg transition whitespace-nowrap">
                      Add Key
                    </button>
                  </form>

                  <div className="bg-slate-200 dark:bg-[#0f172a]/50 rounded-xl border border-slate-300 dark:border-white/5 overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-800 dark:text-gray-400">
                      <thead className="text-[10px] uppercase text-slate-700 dark:text-gray-500 bg-slate-400/10 dark:bg-white/[0.02] tracking-widest border-b border-slate-300 dark:border-white/5">
                        <tr>
                          <th className="px-4 py-4 font-bold">API Key (Masked)</th>
                          <th className="px-4 py-4 font-bold">Added On</th>
                          <th className="px-4 py-4 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {groqKeys.map(gk => (
                          <tr key={gk._id} className="hover:bg-slate-400/10 dark:bg-white/[0.02] transition">
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
                            <td colSpan="3" className="px-4 py-8 text-center text-slate-700 dark:text-gray-500 font-mono text-sm">No Groq keys configured. System will use manual scoring.</td>
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
                      <span className="ml-4 text-xs font-mono text-slate-800 dark:text-gray-400 font-bold uppercase tracking-widest">KPK4444 AI Terminal v1.0</span>
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
                          let color = 'text-slate-800 dark:text-gray-400';
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
              <div className="bg-[#a9a9a9]/60 dark:bg-black/40 border border-slate-300 dark:border-white/5 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Banned IPs</h3>
                    <p className="text-sm text-slate-800 dark:text-gray-400 mt-1">IP addresses blocked due to rate limits or malicious activity.</p>
                  </div>
                  <button onClick={unbanAllIPs} className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border border-orange-500/30 rounded-lg text-sm font-bold transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    UNBAN ALL IPs
                  </button>
                </div>
                
                <div className="bg-slate-200 dark:bg-[#0f172a]/50 rounded-xl border border-slate-300 dark:border-white/5 overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-800 dark:text-gray-400">
                    <thead className="text-[10px] uppercase text-slate-700 dark:text-gray-500 bg-slate-400/10 dark:bg-white/[0.02] tracking-widest border-b border-slate-300 dark:border-white/5">
                      <tr>
                        <th className="px-4 py-4 font-bold">IP Address</th>
                        <th className="px-4 py-4 font-bold">Reason</th>
                        <th className="px-4 py-4 font-bold">Banned Until</th>
                        <th className="px-4 py-4 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bannedIps.map(bip => (
                        <tr key={bip._id} className="hover:bg-slate-400/10 dark:bg-white/[0.02] transition">
                          <td className="px-4 py-3 font-mono text-rose-400 text-[12px]">{bip.ip}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-900 dark:text-gray-300">{bip.reason || 'Malicious Activity'}</td>
                          <td className="px-4 py-3 text-[11px]">{new Date(bip.expiresAt).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => unbanIP(bip.ip)} className="text-[10px] px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded transition font-bold uppercase tracking-wider border border-green-500/20">Unban</button>
                          </td>
                        </tr>
                      ))}
                      {bannedIps.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-slate-700 dark:text-gray-500 font-mono text-sm">No IPs are currently banned.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* View Logs Modal */}
      {viewKeyLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-300/90 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-200 dark:bg-[#0f172a] border border-slate-400/60 dark:border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-300 dark:border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Logs: {viewKeyLogs}</h3>
                <p className="text-[10px] text-slate-800 dark:text-gray-400 uppercase tracking-widest mt-1">Detailed Threat Activity</p>
              </div>
              <button onClick={() => setViewKeyLogs(null)} className="p-2 text-slate-800 dark:text-gray-400 hover:text-slate-900 dark:text-white bg-slate-400/20 dark:bg-white/5 hover:bg-slate-400/30 dark:bg-white/10 rounded-lg transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {logs.filter(l => l.domain === viewKeyLogs).length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-700 dark:text-gray-500 font-mono text-sm">No activity recorded for this domain.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.filter(l => l.domain === viewKeyLogs).map(l => (
                    <div key={l._id} className="bg-[#a9a9a9]/60 dark:bg-black/40 border border-slate-300 dark:border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${l.severity === 'CRITICAL' ? 'bg-rose-500' : l.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${l.severity === 'CRITICAL' ? 'text-rose-400' : l.severity === 'HIGH' ? 'text-orange-400' : 'text-yellow-400'}`}>{l.severity} - {l.category}</span>
                        </div>
                        {l.snippet && (
                          <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded">
                            <p className="font-mono text-[10px] text-rose-300">Payload: {l.snippet}</p>
                          </div>
                        )}
                        {l.userAgent && (
                          <p className="text-[10px] text-slate-700 dark:text-gray-500 font-mono line-clamp-1">{l.userAgent}</p>
                        )}
                      </div>
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center text-[10px] text-slate-800 dark:text-gray-400 space-y-0 md:space-y-1">
                        <span className="font-mono bg-slate-400/20 dark:bg-white/5 px-2 py-1 rounded border border-slate-300 dark:border-white/5">{l.ipAddress}</span>
                        <span>{new Date(l.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── NEW KEY TUTORIAL POPUP ── */}
      {showKeyTutorial && newKeyData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-800/80 dark:bg-black/80 backdrop-blur-md">
          <div className="relative bg-slate-100 dark:bg-[#0a0a0c] bg-opacity-95 backdrop-blur-3xl border border-slate-400/60 dark:border-white/10 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.8)] max-w-4xl w-full mx-auto overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-300 dark:border-white/5 flex justify-between items-center bg-slate-400/10 dark:bg-white/[0.02]">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">System Secured</h3>
                  <p className="text-[10px] text-slate-700 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Integration Guide for OJS {selectedOjsVersion}</p>
                </div>
              </div>
              <button onClick={() => {setShowKeyTutorial(false); setNewKeyData(null);}} className="p-2 text-slate-700 dark:text-gray-500 hover:text-slate-900 dark:text-white bg-slate-400/20 dark:bg-white/5 hover:bg-slate-400/30 dark:bg-white/10 rounded-xl transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
              
              {/* API Key Box */}
              <div>
                <p className="text-[10px] text-slate-700 dark:text-gray-500 font-bold uppercase tracking-widest mb-3 ml-1">Your Secret Key</p>
                <div className="flex items-center justify-between bg-[#a9a9a9]/60 dark:bg-black/40 p-4 rounded-2xl border border-slate-300 dark:border-white/5 group/key hover:border-slate-400/60 dark:border-white/10 transition">
                  <code className="text-emerald-400 font-mono text-base break-all">{newKeyData.apiKey}</code>
                  <button 
                    onClick={handleCopyKey} 
                    className={`ml-6 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex-shrink-0 flex items-center space-x-2 ${copiedKey ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-400/20 dark:bg-white/5 hover:bg-slate-400/30 dark:bg-white/10 text-slate-900 dark:text-gray-300 group-hover/key:text-slate-900 dark:text-white'}`}
                  >
                    {copiedKey ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        <span>Copied</span>
                      </>
                    ) : (
                      'Copy Key'
                    )}
                  </button>
                </div>
              </div>

              {/* Code Installation */}
              <div>
                <p className="text-[10px] text-slate-700 dark:text-gray-500 font-bold uppercase tracking-widest mb-3 ml-1">Installation Code</p>
                <div className="relative group/code">
                  <div className="absolute top-4 right-4 flex space-x-2 z-10">
                    <button 
                      onClick={downloadIndexPhp} 
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 backdrop-blur flex items-center space-x-2 ${downloaded ? 'bg-blue-500 text-slate-900 dark:text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-blue-400' : 'bg-slate-400/30 dark:bg-white/10 hover:bg-white/20 text-slate-900 dark:text-gray-300 border border-transparent opacity-0 group-hover/code:opacity-100'}`}
                    >
                      {downloaded ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          <span>Downloaded</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          <span>Download PHP</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={handleCopyCode} 
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 backdrop-blur flex items-center space-x-2 ${copiedCode ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-slate-400/30 dark:bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white border border-transparent opacity-0 group-hover/code:opacity-100'}`}
                    >
                      {copiedCode ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-[#000000] rounded-2xl p-6 overflow-x-auto max-h-[40vh] custom-scrollbar border border-slate-300 dark:border-white/5 relative">
                    <code className="text-[13px] font-mono text-slate-900 dark:text-gray-300 leading-relaxed">
                      {selectedOjsVersion === '3.3' ? getFullIndexPhp(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL) : getFullIndexPhp34(newKeyData.apiKey, process.env.NEXT_PUBLIC_VERCEL_URL)}
                    </code>
                  </pre>
                </div>
                <div className="mt-6 p-5 bg-slate-400/10 dark:bg-white/[0.02] border border-slate-300 dark:border-white/5 rounded-2xl flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-gray-400 leading-relaxed">
                    Replace the entire contents of <code className="text-slate-900 dark:text-white bg-slate-400/30 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono">index.php</code> in your OJS root folder with the code above. The security system will be activated instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav (mobile only) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-slate-300/90 dark:bg-black/60 backdrop-blur border-t border-slate-300 dark:border-white/5 flex lg:hidden">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest transition-colors ${tab === t ? 'text-blue-400' : 'text-slate-700 dark:text-gray-500 hover:text-slate-900 dark:text-gray-300'}`}
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
          <div className="absolute inset-0 bg-slate-300/90 dark:bg-black/60 backdrop-blur-sm" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}></div>
          <div className="relative bg-slate-800/80 dark:bg-black/80 backdrop-blur-3xl border border-slate-400/60 dark:border-white/10 rounded-3xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] max-w-sm w-full mx-auto transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(225,29,72,0.1)]">
                <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{confirmModal.title}</h3>
              <p className="text-xs text-slate-800 dark:text-gray-400 mb-8 leading-relaxed px-4">{confirmModal.message}</p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                  className="flex-1 py-3.5 bg-slate-400/20 dark:bg-white/5 hover:bg-slate-400/30 dark:bg-white/10 text-slate-900 dark:text-gray-300 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border border-slate-300 dark:border-white/5"
                >
                  Batal
                </button>
                <button 
                  onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); }} 
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-slate-900 dark:text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border border-rose-500/50"
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
