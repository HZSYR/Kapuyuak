import { connectDB } from '../../kpk4444-lib/mongodb';
import LicenseKey from '../../kpk4444-models/LicenseKey';
import Blacklist from '../../kpk4444-models/Blacklist';
import AttackLog from '../../kpk4444-models/AttackLog';
import BannedIP from '../../kpk4444-models/BannedIP';
import GroqKey from '../../kpk4444-models/GroqKey';
import AILog from '../../kpk4444-models/AILog';
import { rateLimitMiddleware } from '../../kpk4444-middleware/rateLimit';
import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: { sizeLimit: '500kb' } // Prevent massive payload DoS
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!await rateLimitMiddleware(req, res, 30)) return;

  const { apiKey, domain, content, type, field } = req.body;
  if (typeof apiKey !== 'string' || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Invalid payload structure' });
  }

  try {
    await connectDB();

    let ip = req.body.userIp || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (typeof ip === 'string') {
      ip = ip.split(',')[0].trim();
    }
    const banned = await BannedIP.findOne({ ip, expiresAt: { $gt: new Date() } });
    if (banned) {
      await AILog.create({ message: `BLOCKED BANNED IP: ${ip} tried to access ${domain}`, level: 'ERROR' });
      return res.status(403).json({ error: 'Access Denied: Your IP is banned', reason: banned.reason });
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
    // 🧠 SUPER SMART AI SCANNER (GROQ - LLAMA 3)
    // Menggunakan GROQ yang super cepat dengan dukungan Multiple API Keys (Backup).
    // =========================================================================
    const groqKeyDocs = await GroqKey.find();
    
    if (groqKeyDocs.length > 0 && content.length > 5) {
      await AILog.create({ message: `Initiating Groq AI Scan for ${content.length} bytes from ${domain}...`, level: 'INFO' });
      const keys = groqKeyDocs.map(k => k.key);
      
      // Acak urutan kunci agar beban terbagi (Load Balancing)
      keys.sort(() => Math.random() - 0.5);

      const systemPrompt = `Anda adalah sistem keamanan siber canggih untuk platform jurnal akademik OJS (KPK4444 Enterprise). Tugas Anda adalah mendeteksi HACK dan SPAM JUDI ONLINE. Analisis teks berikut dan tentukan apakah teks tersebut AMAN, JUDI, atau HACK.

PANDUAN KLASIFIKASI SUPER KETAT:
[KATEGORI 1: AMAN (Konteks Wajar/Akademik/Sehari-hari/Data Sistem)]
- Jurnal akademik murni, penggunaan kata ambigu dalam KONTEKS YANG BENAR (misal: burung kacer gacor, slot memori/parkir, pertandingan sepak bola, BET surface area).
- NAMA ORANG ATAU KATA UMUM SEHARI-HARI (misal: "mas budi", "budi", "agus", "joko", "buku", "jurnal"). JANGAN PERNAH menandai teks sebagai JUDI hanya karena mengandung nama orang.
- DATA SISTEM / FORMULIR / FILE MEDIA: Teks berupa JSON, form data, HTML, CSRF token, URL encoded, ATAU teks acak/gibberish yang merupakan representasi biner dari file GAMBAR/PDF/DOKUMEN (seperti PNG, JPG, JFIF, PDF header) ADALAH SANGAT AMAN. Jangan menandai data biner acak sebagai HACK!

[KATEGORI 2: JUDI (Spam / Promosi Perjudian)]
- Promosi terang-terangan: maxwin, slot zeus, judi bola. Mengajak deposit, bonus new member.
- KEYWORD STUFFING: Tumpukan kata kunci judi tanpa konteks kalimat yang masuk akal.

[KATEGORI 3: HACK (Web Shell / Malware / Serangan Siber)]
- Mengandung kode berbahaya seperti Web Shell, Backdoor, bypass script (contoh file: mainhackbypass.php, shell.php).
- Mengandung fungsi eksekusi sistem jarak jauh (eval, system, exec, base64_decode() yang mencurigakan).
- Merupakan upaya SQL Injection atau XSS.

INSTRUKSI OUTPUT (SANGAT PENTING):
Anda WAJIB merespons HANYA dalam format JSON yang valid (tanpa blok markdown).
Format JSON yang diizinkan:
{
  "status": "AMAN" | "JUDI" | "HACK",
  "reason": "Alasan singkat",
  "new_signatures": ["kata1", "kata2"]
}
Jika status AMAN, "new_signatures" HARUS [].
TUGAS KHUSUS AI SELF-LEARNING: Ekstrak "new_signatures" (1-3 kosa kata judi/hack baru yang sangat spesifik yang Anda temukan).
ANALISIS MENDALAM SEBELUM MENGEKSTRAK: Anda WAJIB menganalisa seluruh kata dan file terlebih dahulu. Pastikan 100% bahwa kosa kata yang diekstrak ke dalam array ini adalah MURNI unsur JUDI atau HACK. JANGAN SEKALI-KALI memasukkan kata-kata normal/akademik, singkatan wajar, dan NAMA ORANG (seperti "mas budi", dll)! Jika tidak yakin, biarkan array kosong [].`;

      let aiSuccess = false;
      
      for (const groqKey of keys) {
        try {
          // AbortController untuk timeout 8 detik (supaya OJS tidak menunggu terlalu lama)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model: 'llama-3.1-8b-instant',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Teks yang dianalisis:\n"""\n${content.substring(0, 8000)}\n"""` }
              ],
              temperature: 0,
              max_tokens: 150,
              response_format: { type: 'json_object' }
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (!aiRes.ok) {
            // Jika key ini limit/error, lanjut ke key berikutnya di loop (Backup jalan)
            console.warn(`Groq key failed with status: ${aiRes.status}, trying next key...`);
            await AILog.create({ message: `API Key (...${groqKey.substring(groqKey.length - 4)}) failed (HTTP ${aiRes.status}). Switching to backup key...`, level: 'WARN' });
            continue; 
          }

          const aiData = await aiRes.json();
          
          if (aiData.choices && aiData.choices.length > 0) {
            const aiText = aiData.choices[0].message.content.trim();
            aiSuccess = true;
            
            // Log respons AI yang sebenarnya untuk debugging di terminal dashboard
            await AILog.create({ message: `AI Response: "${aiText.substring(0, 80)}"`, level: 'INFO' });
            
            try {
              const cleanedText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
              const aiDataParsed = JSON.parse(cleanedText);
              const { status, reason, new_signatures } = aiDataParsed;

              if (status === 'AMAN') {
                await AILog.create({ message: `AI Analysis Complete: Content is SAFE.`, level: 'INFO' });
                return res.status(200).json({ blocked: false });
              } else if (status === 'JUDI' || status === 'HACK') {
                const category = status === 'JUDI' ? 'SPAM_CONTENT' : 'MALWARE';
                
                try {
                    await AILog.create({ message: `AI Detected ${status}: ${reason}`, level: 'BLOCKED' });
                    await AttackLog.create({
                      apiKey, domain, category: category === 'SPAM_CONTENT' ? 'AI_DETECTED_SPAM' : 'AI_DETECTED_MALWARE', severity: 'CRITICAL',
                      field: field || 'unknown', snippet: `[GROQ AI REASON: ${reason}] ${content.substring(0, 100)}`,
                      ipAddress: ip, userAgent: req.headers['user-agent'] || 'unknown'
                    });
                    await BannedIP.findOneAndUpdate(
                      { ip },
                      { reason: `AI Detected ${status}: ${reason}`, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
                      { upsert: true }
                    );

                    // SELF LEARNING: AUTO UPSERT BLACKLIST
                    if (Array.isArray(new_signatures) && new_signatures.length > 0) {
                        for (const sig of new_signatures) {
                            if (typeof sig === 'string' && sig.trim().length > 2) {
                                await Blacklist.updateOne(
                                    { type: 'keyword', value: sig.trim().toLowerCase() },
                                    { $setOnInsert: {
                                        type: 'keyword', value: sig.trim().toLowerCase(),
                                        category: category, severity: status === 'JUDI' ? 'HIGH' : 'CRITICAL',
                                        addedBy: 'AI_AUTO_LEARNING'
                                    }},
                                    { upsert: true }
                                );
                            }
                        }
                        await AILog.create({ message: `AI Auto-Learned ${new_signatures.length} new signatures.`, level: 'INFO' });
                    }
                } catch(dbErr) { console.error(`DB Error on ${status} logging:`, dbErr); }

                return res.status(200).json({
                  blocked: true, category: category, severity: 'CRITICAL',
                  matchedPattern: 'Groq AI Adaptive Scanner', snippet: reason
                });
              } else {
                await AILog.create({ message: `AI Analysis Unknown Status. Output: ${aiText.substring(0, 50)}...`, level: 'WARN' });
                aiSuccess = false;
                break;
              }
            } catch (parseErr) {
               await AILog.create({ message: `AI JSON Parse Failed. Output: ${aiText.substring(0, 50)}...`, level: 'WARN' });
               aiSuccess = false;
               break;
            }
            break; // Keluar dari loop karena berhasil
          }
        } catch (e) {
          console.error("Groq AI Scan failed with a key, falling back...", e);
          await AILog.create({ message: `Network error reaching Groq API. Trying backup key...`, level: 'WARN' });
        }
      }
      
      // Jika semua Groq API Keys gagal/habis limit, sistem otomatis lanjut ke Manual Scoring (Fallback)
      if (!aiSuccess) {
        console.error("All Groq keys failed. Falling back to Manual Scoring.");
        await AILog.create({ message: `All API keys failed or exhausted! Falling back to Manual Scoring algorithm.`, level: 'ERROR' });
      }
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
        ipAddress: ip, userAgent: req.headers['user-agent']
      });

      if (highestSeverity === 'CRITICAL') {
        await BannedIP.findOneAndUpdate(
          { ip },
          { reason: `Triggered CRITICAL patterns: ${matchedPatterns.join(', ')}`, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
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
