import mongoose from 'mongoose';

const LicenseKeySchema = new mongoose.Schema({
  apiKey: { type: String, required: true, unique: true, index: true },
  domain: { type: String, required: true },
  ownerName: { type: String, required: true },
  ojsVersion: { type: String, default: '3.3', enum: ['3.3', '3.4', '3.5'] },
  status: { type: String, default: 'active', enum: ['active', 'suspended', 'expired'] },
  plan: { type: String, default: 'standard' },
  createdAt: { type: Date, default: Date.now },
  expiredAt: { type: Date, required: true },
  lastUsedAt: { type: Date },
  requestCount: { type: Number, default: 0 }
});

export default mongoose.models.LicenseKey || mongoose.model('LicenseKey', LicenseKeySchema);
