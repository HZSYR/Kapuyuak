import { connectDB } from '../../kpk4444-lib/mongodb';
import KapuyuakAI from '../../kpk4444-models/KapuyuakAI';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await connectDB();
    const result = await KapuyuakAI.deleteMany({});
    return res.status(200).json({ 
        success: true, 
        message: "Neural Engine state has been completely wiped. Retraining will occur on next scan.",
        deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Failed to wipe AI State:", error);
    return res.status(500).json({ error: error.message });
  }
}
