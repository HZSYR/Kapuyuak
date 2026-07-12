import { connectDB } from '../kpk4444-lib/mongodb';
import BannedIP from '../kpk4444-models/BannedIP';

const rateLimitCache = new Map();

export async function rateLimitMiddleware(req, res, limit, windowMs = 60000) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const apiKey = req.body?.apiKey || 'none';
  const identifier = req.url.includes('/scan') ? apiKey : ip;
  const now = Date.now();

  try {
    await connectDB();
    const banned = await BannedIP.findOne({ ip });
    if (banned) {
      if (now > banned.expiresAt) {
        await BannedIP.deleteOne({ ip });
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
    
    if (record.violations >= 5) {
      try {
        await BannedIP.findOneAndUpdate(
          { ip },
          { reason: 'Rate limit violation threshold exceeded', expiresAt: new Date(now + 10 * 60 * 1000) },
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
