import { connectDB } from '../../kpk4444-lib/mongodb';
import LicenseKey from '../../kpk4444-models/LicenseKey';
import Blacklist from '../../kpk4444-models/Blacklist';
import AttackLog from '../../kpk4444-models/AttackLog';
import BannedIP from '../../kpk4444-models/BannedIP';
import AILog from '../../kpk4444-models/AILog';
import { rateLimitMiddleware } from '../../kpk4444-middleware/rateLimit';
import crypto from 'crypto';
import { predict, trainAI, generateFlexibleLog } from '../../kpk4444-lib/kapuyuakAI';

export const config = {
  api: {
    bodyParser: { sizeLimit: '500kb' } // Prevent massive payload DoS
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!await rateLimitMiddleware(req, res, 30)) return;

  const { apiKey, domain, content, type, field, username } = req.body;
  if (typeof apiKey !== 'string' || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Invalid payload structure' });
  }

  try {
    await connectDB();

    let ip = req.body.userIp || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (typeof ip === 'string') {
      ip = ip.split(',')[0].trim();
    }
    // Mendukung berbagai versi OJS (3.3, 3.4, 3.5) yang mungkin mengirimkan parameter berbeda
    const reqUsername = req.body.username || req.body.user || req.body.user_id || req.body.userId || req.body.author || req.body.email || 'unknown';
    
    let isGloballyBanned = false;
    let globalBanReason = '';
    
    if (reqUsername !== 'unknown') {
        const userBanned = await BannedIP.findOne({ username: reqUsername, expiresAt: { $gt: new Date() } });
        if (userBanned) {
            isGloballyBanned = true;
            globalBanReason = userBanned.reason;
        }
    } else {
        const ipBanned = await BannedIP.findOne({ ip, username: 'unknown', expiresAt: { $gt: new Date() } });
        if (ipBanned) {
            isGloballyBanned = true;
            globalBanReason = ipBanned.reason;
        }
    }

    if (isGloballyBanned) {
      await AILog.create({ message: `BLOCKED BANNED ENTITY: ${reqUsername !== 'unknown' ? reqUsername : ip} tried to access ${domain}`, level: 'ERROR' });
      return res.status(403).json({ error: 'Access Denied: You are banned', reason: globalBanReason });
    }

    const keyRecord = await LicenseKey.findOne({ domain, status: 'active' });
    if (!keyRecord) {
      await AILog.create({ message: `Access Denied: Invalid or inactive license key for domain '${domain}'`, level: 'ERROR' });
      return res.status(403).json({ error: 'Invalid or inactive license key' });
    }

    // Timing safe equality check to prevent timing attacks
    const providedKeyBuffer = Buffer.from(apiKey);
    const realKeyBuffer = Buffer.from(keyRecord.apiKey);
    if (providedKeyBuffer.length !== realKeyBuffer.length || !crypto.timingSafeEqual(providedKeyBuffer, realKeyBuffer)) {
      await AILog.create({ message: `Access Denied: License key mismatch for domain '${domain}'`, level: 'ERROR' });
      return res.status(403).json({ error: 'Invalid or inactive license key' });
    }
    if (!content || (typeof content === 'string' && content.trim() === '')) return res.status(200).json({ blocked: false });
    
    // =========================================================================
    // 🛡️ FAST MALWARE SIGNATURE SCANNER (STATIC ZERO-DAY)
    // =========================================================================
    const malwareSignatures = [
      /eval\s*\(\s*base64_decode\s*\(/i,
      /system\s*\(\s*\$_GET/i,
      /system\s*\(\s*\$_POST/i,
      /shell_exec\s*\(/i,
      /passthru\s*\(/i,
      /exec\s*\(\s*\$_/i,
      /\$_POST\s*\[\s*['"]cmd['"]\s*\]/i,
      /wscript\.shell/i,
      /php:\/\/filter\/.*convert\.iconv/i,
      /(?:169\.254\.169\.254|metadata\.google\.internal)/i,
      /\{php\}.*system\(.*\{(?:\/)?php\}/i,
      /\b(?:move_uploaded_file|file_put_contents)\s*\(\s*(?:\$_(?:FILES|POST|GET)|php:\/\/input)/i,
      /\.phar|\.pht(?:ml)?|\.php[3-8]/i,
      /phar:\/\//i
    ];
    
    let signatureMatch = false;
    let matchedSigStr = '';
    if (typeof content === 'string') {
        for (const sig of malwareSignatures) {
            const m = content.match(sig);
            if (m) {
                signatureMatch = true;
                matchedSigStr = m[0];
                break;
            }
        }
    }

    if (signatureMatch) {
        // Hanya training Naive Bayes, TIDAK otomatis tambah ke Blacklist DB (mencegah keracunan data)
        await trainAI(content, 'HACK');
        await AILog.create({ message: `MALWARE DETECTED: Web Shell Signature Blocked from ${domain}`, level: 'CRITICAL' });
        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + 1);
        if (reqUsername !== 'unknown') {
            await BannedIP.findOneAndUpdate(
                { username: reqUsername },
                { ip, username: reqUsername, domain, reason: 'Malware Signature Detected (Web Shell)', expiresAt: expireDate },
                { upsert: true }
            );
        } else {
            await BannedIP.findOneAndUpdate(
                { ip, username: 'unknown' },
                { ip, username: 'unknown', domain, reason: 'Malware Signature Detected (Web Shell)', expiresAt: expireDate },
                { upsert: true }
            );
        }
        return res.status(200).json({ blocked: true });
    }

    // =========================================================================
    // =========================================================================
    // 🧠 KAPUYUAK DEEP LEARNING SCANNER (NEURAL ENGINE)
    // =========================================================================
    if (content.length > 5) {
        await AILog.create({ message: `Initiating Kapuyuak Deep Learning Scan for ${domain}...`, level: 'INFO' });
        
        let mlResult = 'AMAN';
        
        // =========================================================================
        // 🛡️ HEURISTIC SCAN (PRE-FILTER) FOR HIGH RISK PATTERNS
        // =========================================================================
        const hackPattern = /\b([a-zA-Z0-9_\-\.]+)\.(php[34578]?|phtml|sh|py|cgi|exe)\b|eval\s*\(|base64_decode\s*\(|system\s*\(|exec\s*\(/i;
        
        let heuristicMatch = content.match(hackPattern);
        if (heuristicMatch) {
            mlResult = 'HACK';
            // Hanya training model, TIDAK tambah ke Blacklist DB (mencegah keracunan data)
            await trainAI(content, 'HACK');
            await AILog.create({ message: `Heuristic Scanner Blocked High-Risk Pattern (Regex Match)`, level: 'BLOCKED' });
        } else {
            // Bypass Naive Bayes for very short inputs to prevent False Positives (like "ewtret")
            const wordCount = content.trim().split(/\s+/).length;
            if (wordCount < 3 && content.length < 20) {
                mlResult = 'AMAN';
            } else {
                mlResult = await predict(content);
                
                // --- VERIFIKASI ANTI FALSE-POSITIVE ---
                // Bias Laplace Smoothing pada Naive Bayes menyebabkan kata yang sama sekali belum pernah dilihat (seperti 'dfsgdrf') 
                // akan condong ke class dengan jumlah kata terkecil. Kita harus memverifikasi tebakan AI.
                
                if (mlResult === 'HACK') {
                    // Serangan siber (XSS, SQLi, RCE, LFI) PASTI memiliki tanda baca khusus.
                    // Jika hanya teks alfanumerik biasa (seperti 'dfsgdrf'), itu pasti False Positive.
                    const hasPunctuation = /[()<>{}\[\]=;$\/\\'"\-\.]/.test(content);
                    if (!hasPunctuation) {
                        mlResult = 'AMAN';
                    }
                } else if (mlResult === 'JUDI') {
                    // Jika ditebak JUDI, pastikan minimal ada 1 suku kata yang mengarah ke sana
                    const judiKeywords = /slot|gacor|togel|casino|judi|bet|qq|poker|jackpot|scatter|rtp|maxwin|deposit|bonus|taruhan/i;
                    if (!judiKeywords.test(content)) {
                        mlResult = 'AMAN';
                    }
                }
            }
        }
        await AILog.create({ message: `Kapuyuak AI Response: "${mlResult}"`, level: 'INFO' });

        if (mlResult === 'JUDI' || mlResult === 'HACK') {
            await AILog.create({ message: generateFlexibleLog(content, mlResult, domain, ip, reqUsername), level: 'BLOCKED' });
            
            if (!heuristicMatch) {
                // Hanya training model Naive Bayes saja, TIDAK otomatis tambah ke Blacklist DB
                // (Fitur auto-learning ke DB dinonaktifkan karena bisa keracunan false positive)
                await trainAI(content, mlResult);
            }

            const expireDate = new Date();
            expireDate.setHours(expireDate.getHours() + 1); // Ban 1 jam
            const category = mlResult === 'JUDI' ? 'AI_DETECTED_SPAM' : 'AI_DETECTED_MALWARE';
            
            await AttackLog.create({
                apiKey, domain, category: category, severity: 'CRITICAL',
                field: field || 'unknown', snippet: `[KAPUYUAK AI] ${content.substring(0, 100)}`,
                ipAddress: ip, userAgent: req.headers['user-agent'] || 'unknown', username: username || 'unknown'
            });
            // Tambahkan User/IP ke database blacklist Vercel secara adil
            const banExpireDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 Hari Ban
            if (reqUsername !== 'unknown') {
                await BannedIP.findOneAndUpdate({ username: reqUsername }, { ip, username: reqUsername, domain, reason: `Kapuyuak Deep Learning Blocked (${mlResult})`, expiresAt: banExpireDate }, { upsert: true });
            } else {
                await BannedIP.findOneAndUpdate({ ip, username: 'unknown' }, { ip, username: 'unknown', domain, reason: `Kapuyuak Deep Learning Blocked (${mlResult})`, expiresAt: banExpireDate }, { upsert: true });
            }
            
            return res.status(200).json({ blocked: true });
        }
        
        await AILog.create({ message: generateFlexibleLog(content, 'AMAN', domain, ip, reqUsername), level: 'INFO' });
        return res.status(200).json({ blocked: false });
    }

    // =========================================================================
    // ⚙️ MANUAL SCORING ALGORITHM (FALLBACK JIKA AI MATI/LIMIT)
    // =========================================================================
    const blacklists = await Blacklist.find();
    
    let spamScore = 0;
    let highestSeverity = 'LOW';
    let matchedPatterns = [];
    let blockedCategory = 'SPAM_CONTENT';

    for (const item of blacklists) {
      let matched = false;
      if (item.type === 'keyword') {
        if (item.value.length >= 5) {
          if (new RegExp(item.value, 'i').test(content)) matched = true;
        } else {
          if (new RegExp(`\\b${item.value}\\b`, 'i').test(content)) matched = true;
        }
      } else if (item.type === 'regex') {
        try { if (new RegExp(item.value, 'i').test(content)) matched = true; } catch(e) {}
      } else if (item.type === 'sqlpattern') {
        if (new RegExp(item.value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i').test(content)) matched = true;
      } else if (item.type === 'domain') {
        if (content.includes(item.value)) matched = true;
      }

      if (matched) {
        matchedPatterns.push(item.value);
        
        // Technical attacks (SQL, dll) langsung 100 poin (Blokir instan)
        if (item.category !== 'SPAM_CONTENT') {
          spamScore += 100;
          blockedCategory = item.category;
          highestSeverity = item.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH';
        } else {
          // Spam content dihitung poinnya (Smart Scoring)
          if (item.severity === 'CRITICAL') spamScore += 100;
          else if (item.severity === 'HIGH') spamScore += 50;
          else if (item.severity === 'MEDIUM') spamScore += 30;
          else spamScore += 10;
          
          if (item.severity === 'CRITICAL') highestSeverity = 'CRITICAL';
          else if (highestSeverity !== 'CRITICAL' && item.severity === 'HIGH') highestSeverity = 'HIGH';
        }

        if (spamScore >= 100) break; // Sudah cukup poin untuk memblokir
      }
    }

    // Hanya blokir jika skor ancaman >= 100
    if (spamScore >= 100) {
      await AttackLog.create({
        apiKey, domain, category: blockedCategory, severity: highestSeverity,
        field: field || 'unknown', snippet: content.substring(0, 200),
        ipAddress: ip, userAgent: req.headers['user-agent'], username: username || 'unknown'
      });

      // Blokir adil: hanya username jika diketahui, hanya IP jika anonim
      if (reqUsername !== 'unknown') {
        await BannedIP.findOneAndUpdate(
          { username: reqUsername },
          { ip, username: reqUsername, reason: `Triggered ${highestSeverity} patterns: ${matchedPatterns.join(', ')}`, domain, expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) },
          { upsert: true }
        );
      } else {
        await BannedIP.findOneAndUpdate(
          { ip, username: 'unknown' },
          { ip, username: 'unknown', reason: `Triggered ${highestSeverity} patterns: ${matchedPatterns.join(', ')}`, domain, expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) },
          { upsert: true }
        );
      }

      return res.status(200).json({
        blocked: true, category: blockedCategory, severity: highestSeverity,
        matchedPattern: matchedPatterns.join(', '), snippet: content.substring(0, 100)
      });
    }

    return res.status(200).json({ blocked: false });
  } catch (error) {
    console.error("FATAL ERROR in /api/scan:", error);
    // FAIL OPEN: Jika sistem error internal, jangan blokir OJS. Biarkan jalan.
    return res.status(200).json({ blocked: false, error: 'Internal Server Error Fallback' });
  }
}
