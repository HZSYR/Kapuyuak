import { connectDB } from '../../kpk4444-lib/mongodb';
import BannedIP from '../../kpk4444-models/BannedIP';
import LicenseKey from '../../kpk4444-models/LicenseKey';
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
    let target = 'ALL';
    let deletedCount = 0;
    
    if (ip && typeof ip === 'string') {
      target = ip.trim();
      const result = await BannedIP.deleteMany({ ip: target });
      deletedCount = result.deletedCount;
    } else if (username && typeof username === 'string') {
      target = username.trim();
      const result = await BannedIP.deleteMany({ username: target });
      deletedCount = result.deletedCount;
    } else {
      // Fallback: unban all
      const result = await BannedIP.deleteMany({});
      deletedCount = result.deletedCount;
    }

    // 🌐 Broadcast unban ke semua domain OJS yang aktif agar cache lokal (.txt) ikut terhapus
    try {
        const activeKeys = await LicenseKey.find({ status: 'active' });
        const unbanPromises = activeKeys.map(key => {
            const url = `https://${key.domain}/?kpk_unban=${key.apiKey}&target_ip=${target}`;
            // Timeout agar dashboard tidak hang jika domain mati
            return fetch(url, { signal: AbortSignal.timeout(3000) }).catch(() => {});
        });
        Promise.allSettled(unbanPromises); // Fire and forget
    } catch (e) {
        console.error("Failed to broadcast unban:", e);
    }

    return res.status(200).json({ success: true, count: deletedCount, target });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
