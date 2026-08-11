import { connectDB } from '../../kpk4444-lib/mongodb';
import BannedIP from '../../kpk4444-models/BannedIP';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    jwt.verify(token, JWT_SECRET);
    
    await connectDB();

    const { ip, username } = req.body || {};

    // 🔒 Selective unban: unban specific IP or username if provided
    if (ip && typeof ip === 'string') {
      const result = await BannedIP.deleteMany({ ip: ip.trim() });
      return res.status(200).json({ success: true, count: result.deletedCount, target: ip.trim() });
    }
    if (username && typeof username === 'string') {
      const result = await BannedIP.deleteMany({ username: username.trim() });
      return res.status(200).json({ success: true, count: result.deletedCount, target: username.trim() });
    }

    // Fallback: unban all
    const result = await BannedIP.deleteMany({});
    res.status(200).json({ success: true, count: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
