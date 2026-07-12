import { connectDB } from '../../kpk4444-lib/mongodb';
import AttackLog from '../../kpk4444-models/AttackLog';
import LicenseKey from '../../kpk4444-models/LicenseKey';

import { verifyAdminJWT } from '../../kpk4444-middleware/auth';

export default async function handler(req, res) {
  await connectDB();

  if (req.method === 'POST') {
    const { apiKey, domain, category, severity, field, snippet, ipAddress, userAgent, username } = req.body;
    const key = await LicenseKey.findOne({ apiKey, domain, status: 'active' });
    if (!key) return res.status(403).json({ error: 'Invalid key' });

    const log = await AttackLog.create({ apiKey, domain, category, severity, field, snippet, ipAddress, userAgent, username });
    return res.status(201).json({ success: true, id: log._id });
  } 
  
  if (req.method === 'GET') {
    if (!verifyAdminJWT(req)) return res.status(401).json({ error: 'Unauthorized JWT' });
    
    const logs = await AttackLog.find().sort({ timestamp: -1 }).limit(req.query.export ? 10000 : 100);
    
    if (req.query.export) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attack_logs.csv"');
      const csv = ['timestamp,domain,category,severity,ipAddress,field\n']
        .concat(logs.map(l => `${l.timestamp},${l.domain},${l.category},${l.severity},${l.ipAddress},${l.field}\n`))
        .join('');
      return res.status(200).send(csv);
    }
    return res.status(200).json(logs);
  }
  return res.status(405).json({ error: 'Method Not Allowed' });
}
