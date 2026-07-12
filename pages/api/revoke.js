import { connectDB } from '../../kpk4444-lib/mongodb';
import LicenseKey from '../../kpk4444-models/LicenseKey';

import { verifyAdminJWT } from '../../kpk4444-middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!verifyAdminJWT(req)) return res.status(401).json({ error: 'Unauthorized JWT' });

  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'apiKey is required' });

  await connectDB();
  const key = await LicenseKey.findOneAndUpdate({ apiKey }, { status: 'suspended' });
  if (!key) return res.status(404).json({ error: 'API key not found' });

  return res.status(200).json({ success: true, message: 'API key suspended' });
}
