import mongoose from 'mongoose';

const AttackLogSchema = new mongoose.Schema({
  apiKey: { type: String, required: true },
  domain: { type: String, required: true },
  category: { type: String, required: true, enum: ['SPAM_CONTENT', 'FILE_INJECTION', 'SQL_INJECTION_ATTEMPT', 'SUSPICIOUS_LINK', 'DOMAIN_MISMATCH', 'SQL_INJECTION', 'MALWARE', 'AI_DETECTED_SPAM', 'AI_DETECTED_MALWARE'] },
  severity: { type: String, required: true, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  field: { type: String },
  snippet: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  username: { type: String },
  timestamp: { type: Date, default: Date.now },
  reviewed: { type: Boolean, default: false }
});

export default mongoose.models.AttackLog || mongoose.model('AttackLog', AttackLogSchema);
