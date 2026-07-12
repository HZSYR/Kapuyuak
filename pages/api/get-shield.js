import { connectDB } from '../../kpk4444-lib/mongodb';
import LicenseKey from '../../kpk4444-models/LicenseKey';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { apiKey, domain } = req.body;
  if (!apiKey || !domain) return res.status(400).json({ error: 'Missing parameters' });
  
  await connectDB();
  const keyRecord = await LicenseKey.findOne({ domain, status: 'active' });
  
  if (!keyRecord) return res.status(403).json({ error: 'Unauthorized' });

  try {
    const providedKeyBuffer = Buffer.from(apiKey);
    const realKeyBuffer = Buffer.from(keyRecord.apiKey);
    if (providedKeyBuffer.length !== realKeyBuffer.length || !crypto.timingSafeEqual(providedKeyBuffer, realKeyBuffer)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
  } catch (e) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Minified & Obfuscated KPK4444 Security Shield
  const script = '!function(){document.addEventListener("contextmenu",function(e){e.preventDefault()});document.addEventListener("keydown",function(e){if(123===e.keyCode||e.ctrlKey&&e.shiftKey&&(73===e.keyCode||74===e.keyCode)||e.ctrlKey&&85===e.keyCode){e.preventDefault();window.location.href="https://www.google.com"}});var e=function(){var n=(new Date).getTime();debugger;if((new Date).getTime()-n>50){document.documentElement.innerHTML="<h1>KPK4444 SECURITY SHIELD: DEVTOOLS DETECTED</h1>";window.location.href="https://www.google.com"}setTimeout(e,50)};e();var n=function(){if(window.outerWidth-window.innerWidth>160||window.outerHeight-window.innerHeight>160){document.documentElement.innerHTML="<h1>KPK4444 SECURITY SHIELD: DEVTOOLS DETECTED</h1>";window.location.href="https://www.google.com"}};setInterval(n,500);window.addEventListener("resize",n)}();';

  res.setHeader('Content-Type', 'application/javascript');
  res.status(200).send(script);
}
