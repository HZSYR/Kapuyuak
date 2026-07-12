import { connectDB } from '../../kpk4444-lib/mongodb';
import AILog from '../../kpk4444-models/AILog';
import { verifyAdminJWT } from '../../kpk4444-middleware/auth';

export default async function handler(req, res) {
  if (!verifyAdminJWT(req)) return res.status(401).json({ error: 'Unauthorized JWT' });
  await connectDB();

  if (req.method === 'GET') {
    try {
      const logs = await AILog.find().sort({ timestamp: -1 }).limit(100);
      return res.status(200).json(logs);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await AILog.deleteMany({});
      return res.status(200).json({ message: 'Terminal cleared' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
