import { connectDB } from '../../kpk4444-lib/mongodb';
import LicenseKey from '../../kpk4444-models/LicenseKey';
import AttackLog from '../../kpk4444-models/AttackLog';
import BannedIP from '../../kpk4444-models/BannedIP';
import { rateLimitMiddleware } from '../../kpk4444-middleware/rateLimit';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!await rateLimitMiddleware(req, res, 40)) return; // Stricter limit

  const { apiKey, domain } = req.body;
  if (typeof apiKey !== 'string' || typeof domain !== 'string') return res.status(400).json({ error: 'MISSING_PARAMS' });

  await connectDB();
  const keyRecord = await LicenseKey.findOne({ apiKey });
  
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  if (!keyRecord) {
    return res.status(403).json({ error: 'KEY_NOT_FOUND' });
  }
  if (keyRecord.status !== 'active') return res.status(403).json({ error: 'KEY_SUSPENDED' });

  if (keyRecord.domain !== domain) {
    await AttackLog.create({
      apiKey, domain, category: 'DOMAIN_MISMATCH', severity: 'CRITICAL',
      ipAddress: ip, userAgent: req.headers['user-agent']
    });
    
    // Auto ban for domain spoofing attempt
    await BannedIP.findOneAndUpdate(
      { ip },
      { reason: 'Domain Mismatch Spoofing', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      { upsert: true }
    );
    
    return res.status(403).json({ error: 'DOMAIN_MISMATCH' });
  }

  if (new Date() > keyRecord.expiredAt) {
    keyRecord.status = 'expired';
    await keyRecord.save();
    return res.status(403).json({ error: 'EXPIRED' });
  }

  keyRecord.lastUsedAt = new Date();
  keyRecord.requestCount += 1;
  await keyRecord.save();

  return res.status(200).json({ valid: true, domain: keyRecord.domain, plan: keyRecord.plan, expiredAt: keyRecord.expiredAt });
}
