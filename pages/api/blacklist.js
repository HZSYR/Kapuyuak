import { connectDB } from '../../kpk4444-lib/mongodb';
import Blacklist from '../../kpk4444-models/Blacklist';

import { verifyAdminJWT } from '../../kpk4444-middleware/auth';

export default async function handler(req, res) {
  if (!verifyAdminJWT(req)) return res.status(401).json({ error: 'Unauthorized JWT' });
  await connectDB();

  if (req.method === 'GET') {
    const items = await Blacklist.find().sort({ addedAt: -1 });
    return res.status(200).json(items);
  } else if (req.method === 'POST') {
    const { type, value, category, severity } = req.body;
    const item = await Blacklist.create({ type, value, category, severity, addedBy: 'admin' });
    return res.status(201).json(item);
  } else if (req.method === 'DELETE') {
    await Blacklist.findByIdAndDelete(req.body.id);
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method Not Allowed' });
}
