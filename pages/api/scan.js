import { connectDB } from '../../kpk4444-lib/mongodb';
import LicenseKey from '../../kpk4444-models/LicenseKey';
import Blacklist from '../../kpk4444-models/Blacklist';
import AttackLog from '../../kpk4444-models/AttackLog';
import BannedIP from '../../kpk4444-models/BannedIP';
import AILog from '../../kpk4444-models/AILog';
import { rateLimitMiddleware } from '../../kpk4444-middleware/rateLimit';
import crypto from 'crypto';
import { predict, trainAI } from '../../kpk4444-lib/kapuyuakAI';

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

    // 🔒 SECURITY: IP hanya dari trusted server headers, BUKAN dari req.body (bisa dipalsukan)
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (typeof ip === 'string') {
      ip = ip.split(',')[0].trim();
    }
    const reqUsername = username || 'unknown';
    
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
        if (matchedSigStr) {
            await Blacklist.findOneAndUpdate(
                { value: matchedSigStr, type: 'keyword' },
                { value: matchedSigStr, type: 'keyword', category: 'MALWARE', severity: 'CRITICAL', addedBy: 'AI_AUTO_LEARNING' },
                { upsert: true }
            );
            await trainAI(content, 'HACK');
        }
        await AILog.create({ message: `MALWARE DETECTED: Web Shell Signature Blocked from ${domain}`, level: 'CRITICAL' });
        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + 1); // Ban 1 jam
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
        await AttackLog.create({
            apiKey, domain, category: 'AI_DETECTED_MALWARE', severity: 'CRITICAL',
            field: field || 'unknown', snippet: `[SIGNATURE SCANNER] ${content.substring(0, 100)}`,
            ipAddress: ip, userAgent: req.headers['user-agent'] || 'unknown', username: reqUsername
        });
        return res.status(200).json({ blocked: true });
    }

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
            await Blacklist.findOneAndUpdate(
                { value: heuristicMatch[0], type: 'keyword' },
                { value: heuristicMatch[0], type: 'keyword', category: 'MALWARE', severity: 'CRITICAL', addedBy: 'AI_AUTO_LEARNING' },
                { upsert: true }
            );
            await trainAI(content, 'HACK');
            await AILog.create({ message: `Heuristic Scanner Blocked High-Risk Pattern (Regex Match)`, level: 'BLOCKED' });
        } else {
            mlResult = await predict(content);
        }
        await AILog.create({ message: `Kapuyuak AI Response: "${mlResult}"`, level: 'INFO' });

        if (mlResult === 'JUDI' || mlResult === 'HACK') {
            await AILog.create({ message: `Kapuyuak AI Detected ${mlResult}`, level: 'BLOCKED' });
            
            // Dihapus: AI tidak boleh melatih dirinya sendiri menggunakan tebakannya sendiri (mencegah model poisoning/collapse).
            // Dihapus: Pembuatan Blacklist otomatis dari 40 karakter pertama payload dihapus karena menyebabkan false positive massal.

            const expireDate = new Date();
            expireDate.setHours(expireDate.getHours() + 1); // Ban 1 jam
            const category = mlResult === 'JUDI' ? 'AI_DETECTED_SPAM' : 'AI_DETECTED_MALWARE';
            
            await AttackLog.create({
                apiKey, domain, category: category, severity: 'CRITICAL',
                field: field || 'unknown', snippet: `[KAPUYUAK AI] ${content.substring(0, 100)}`,
                ipAddress: ip, userAgent: req.headers['user-agent'] || 'unknown', username: username || 'unknown'
            });
            // Tambahkan ke database blacklist Vercel
            const banExpireDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 Hari Ban
            if (reqUsername !== 'unknown') {
                await BannedIP.findOneAndUpdate({ username: reqUsername }, { ip, username: reqUsername, domain, reason: `Kapuyuak Deep Learning Blocked (${mlResult})`, expiresAt: banExpireDate }, { upsert: true });
            } else {
                await BannedIP.findOneAndUpdate({ ip, username: 'unknown' }, { ip, username: 'unknown', domain, reason: `Kapuyuak Deep Learning Blocked (${mlResult})`, expiresAt: banExpireDate }, { upsert: true });
            }
            
            return res.status(200).json({ blocked: true });
        }
        
        await AILog.create({ message: `Kapuyuak AI Complete: Content is SAFE.`, level: 'INFO' });
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

      // 🔒 SECURITY: Skip regex patterns that are too long or potentially dangerous (ReDoS prevention)
      if (item.value && item.value.length > 500) continue;

      if (item.type === 'keyword') {
        if (item.value.length >= 5) {
          try { if (new RegExp(item.value, 'i').test(content)) matched = true; } catch(e) {}
        } else {
          try { if (new RegExp(`\\b${item.value}\\b`, 'i').test(content)) matched = true; } catch(e) {}
        }
      } else if (item.type === 'regex') {
        try {
          // Validate regex isn't catastrophically backtracking-prone
          const dangerousPattern = /(\([^)]*\+[^)]*\)\+|\([^)]*\*[^)]*\)\*|\([^)]*\{[^)]*\)\{)/;
          if (dangerousPattern.test(item.value)) continue; // Skip dangerous regex
          if (new RegExp(item.value, 'i').test(content)) matched = true;
        } catch(e) {}
      } else if (item.type === 'sqlpattern') {
        try { if (new RegExp(item.value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i').test(content)) matched = true; } catch(e) {}
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

      const expireHour = new Date(Date.now() + 1 * 60 * 60 * 1000);
      if (reqUsername !== 'unknown') {
          await BannedIP.findOneAndUpdate(
            { username: reqUsername },
            { ip, username: reqUsername, reason: `Triggered ${highestSeverity} patterns: ${matchedPatterns.join(', ')}`, domain, expiresAt: expireHour },
            { upsert: true }
          );
      } else {
          await BannedIP.findOneAndUpdate(
            { ip, username: 'unknown' },
            { ip, username: 'unknown', reason: `Triggered ${highestSeverity} patterns: ${matchedPatterns.join(', ')}`, domain, expiresAt: expireHour },
            { upsert: true }
          );
      }

      // SAFE AUTO-LEARNING (SUPERVISED): AI belajar dari data yang tertangkap basah oleh algoritma manual.
      // Hal ini membuat AI semakin pintar tanpa resiko "keracunan tebakan sendiri" (Model Poisoning).
      try {
          const learnLabel = blockedCategory === 'SPAM_CONTENT' ? 'JUDI' : 'HACK';
          await trainAI(content, learnLabel);
          await AILog.create({ message: `AI Auto-Learned from Manual Detection (${learnLabel})`, level: 'INFO' });
      } catch (e) {
          // Abaikan jika error saat training
      }
      
      return res.status(200).json({
        blocked: true, category: blockedCategory, severity: highestSeverity,
        matchedPattern: matchedPatterns.join(', '), snippet: content.substring(0, 100)
      });
    }

    return res.status(200).json({ blocked: false });
  } catch (error) {
    console.error("FATAL ERROR in /api/scan:", error);
    // 🔒 FAIL-CLOSED: Jika sistem error, BLOKIR konten demi keamanan.
    // Lebih baik false-positive daripada meloloskan serangan.
    return res.status(200).json({ blocked: true, error: 'Security Failsafe Activated' });
  }
}
