import crypto from 'crypto';
import { connectDB } from '../../kpk4444-lib/mongodb';
import LicenseKey from '../../kpk4444-models/LicenseKey';

import { verifyAdminJWT } from '../../kpk4444-middleware/auth';

export default async function handler(req, res) {
  if (!verifyAdminJWT(req)) {
    return res.status(401).json({ error: 'Unauthorized JWT' });
  }
  
  await connectDB();

  if (req.method === 'GET') {
    const keys = await LicenseKey.find().sort({ createdAt: -1 });
    return res.status(200).json(keys);
  }

  if (req.method === 'POST') {
    const { domain, ownerName, validDays } = req.body;
    if (!domain || !ownerName || !validDays) return res.status(400).json({ error: 'Missing required fields' });
    
    const apiKey = 'kpk4444_live_' + crypto.randomBytes(24).toString('hex');
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + parseInt(validDays));

    const newKey = await LicenseKey.create({ apiKey, domain, ownerName, expiredAt });
    const activationLink = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/activate?key=${apiKey}`;

    return res.status(200).json({ success: true, apiKey, activationLink, domain, ownerName, expiredAt: newKey.expiredAt, createdAt: newKey.createdAt });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing key ID' });
    await LicenseKey.findByIdAndDelete(id);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
