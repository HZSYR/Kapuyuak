import { getKapuyuakConfig, toggleEngine } from '../../kpk4444-lib/kapuyuakAI';
import { rateLimitMiddleware } from '../../kpk4444-middleware/rateLimit';

export default async function handler(req, res) {
  if (!await rateLimitMiddleware(req, res, 20)) return;

  if (req.method === 'GET') {
    try {
      const config = await getKapuyuakConfig();
      return res.status(200).json({ 
        activeEngine: config.activeEngine,
        trainingSamples: config.trainingSamples,
        lastTrainedAt: config.lastTrainedAt
      });
    } catch (e) {
      return res.status(500).json({ error: 'Server error' });
    }
  } 
  
  if (req.method === 'POST') {
    const { action, engine } = req.body;
    if (action === 'TOGGLE_ENGINE' && ['GROQ', 'KAPUYUAK'].includes(engine)) {
      try {
        const active = await toggleEngine(engine);
        return res.status(200).json({ success: true, activeEngine: active });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to toggle engine' });
      }
    }
    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
