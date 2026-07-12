import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const { secret, recaptchaToken } = req.body;
  
  // Verify reCAPTCHA
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'Please complete the reCAPTCHA' });
  }

  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
  try {
    const recaptchaRes = await fetch(verifyUrl, { method: 'POST' });
    const recaptchaData = await recaptchaRes.json();
    
    if (!recaptchaData.success) {
      return res.status(400).json({ error: 'reCAPTCHA verification failed. Please try again.' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server error during reCAPTCHA verification' });
  }
  
  if (secret === process.env.ADMIN_SECRET) {
    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.status(200).json({ token });
  }
  
  return res.status(401).json({ error: 'Invalid secret' });
}
