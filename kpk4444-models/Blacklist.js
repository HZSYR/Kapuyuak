import mongoose from 'mongoose';

const BlacklistSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['keyword', 'domain', 'regex', 'sqlpattern'] },
  value: { type: String, required: true },
  category: { type: String, required: true, enum: ['SPAM_CONTENT', 'SQL_INJECTION', 'SUSPICIOUS_LINK', 'MALWARE'] },
  severity: { type: String, required: true, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  addedAt: { type: Date, default: Date.now },
  addedBy: { type: String, required: true }
});

export default mongoose.models.Blacklist || mongoose.model('Blacklist', BlacklistSchema);
