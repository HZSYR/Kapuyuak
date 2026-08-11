import { connectDB } from '../kpk4444-lib/mongodb';
import BannedIP from '../kpk4444-models/BannedIP';

const rateLimitCache = new Map();

const hardwareBanCache = new Map();

export async function rateLimitMiddleware(req, res, limit, windowMs = 60000) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (hardwareBanCache.has(ip) && now < hardwareBanCache.get(ip)) {
      res.status(403).json({ error: 'L7 SHIELD: IP banned at edge layer due to flood.' });
      return false;
  }
  if (hardwareBanCache.has(ip) && now >= hardwareBanCache.get(ip)) hardwareBanCache.delete(ip);

  const apiKey = req.body?.apiKey || 'none';
  const identifier = `${ip}_${apiKey}`;

  try {
    await connectDB();
    // Hanya periksa ban IP global (username: 'unknown'), biarkan ban spesifik username ditangani oleh scan.js
    const banned = await BannedIP.findOne({ ip, username: 'unknown' });
    if (banned) {
      if (now > banned.expiresAt) {
        await BannedIP.deleteOne({ ip, username: 'unknown' });
      } else {
        res.status(403).json({ error: 'BLOCKED: Your IP is temporarily banned for 10 minutes due to malicious activity.' });
        return false;
      }
    }
  } catch (err) {
    console.error("DB Error in Rate Limit:", err);
  }

  if (!rateLimitCache.has(identifier)) {
    rateLimitCache.set(identifier, { count: 1, resetTime: now + windowMs, violations: 0 });
    return true;
  }
  
  const record = rateLimitCache.get(identifier);
  if (now > record.resetTime) {
    rateLimitCache.set(identifier, { count: 1, resetTime: now + windowMs, violations: record.violations });
    return true;
  }
  
  if (record.count >= limit) {
    record.violations += 1;
    rateLimitCache.set(identifier, record);
    
    if (record.violations >= 3) {
      hardwareBanCache.set(ip, now + (15 * 60 * 1000)); 
      try {
        await connectDB();
        await BannedIP.findOneAndUpdate(
          { ip, username: 'unknown' },
          { ip, username: 'unknown', reason: 'L7 DDoS Flood / API Rate Limit Exceeded', expiresAt: new Date(now + 15 * 60 * 1000) },
          { upsert: true }
        );
      } catch(e) {}
    }
    
    res.status(429).json({ error: 'Too Many Requests. Slow down.' });
    return false;
  }
  
  record.count++;
  rateLimitCache.set(identifier, record);
  return true;
}
