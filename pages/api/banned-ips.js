import { connectDB } from '../../kpk4444-lib/mongodb';
import BannedIP from '../../kpk4444-models/BannedIP';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    jwt.verify(token, JWT_SECRET);
    await connectDB();

    if (req.method === 'GET') {
      const ips = await BannedIP.find().sort({ createdAt: -1 }).lean();
      return res.status(200).json(ips);
    } 
    else if (req.method === 'DELETE') {
      const { ip } = req.query;
      if (ip) {
        await BannedIP.deleteOne({ ip });
      } else {
        await BannedIP.deleteMany({});
      }
      return res.status(200).json({ success: true });
    }
    
    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
