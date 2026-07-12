import { connectDB } from '../../kpk4444-lib/mongodb';
import GroqKey from '../../kpk4444-models/GroqKey';
import { verifyAdminJWT } from '../../kpk4444-middleware/auth';

export default async function handler(req, res) {
  if (!verifyAdminJWT(req)) return res.status(401).json({ error: 'Unauthorized JWT' });
  await connectDB();

  if (req.method === 'GET') {
    try {
      const keys = await GroqKey.find().sort({ addedAt: -1 });
      return res.status(200).json(keys);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { key } = req.body;
      if (!key || typeof key !== 'string') return res.status(400).json({ error: 'Key is required' });
      
      const newKey = await GroqKey.create({ key: key.trim() });
      return res.status(201).json(newKey);
    } catch (err) {
      if (err.code === 11000) return res.status(400).json({ error: 'Key already exists' });
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID is required' });

      await GroqKey.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Deleted successfully' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
