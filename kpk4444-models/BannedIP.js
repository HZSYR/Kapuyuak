import mongoose from 'mongoose';

const BannedIPSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true, index: true },
  reason: { type: String },
  bannedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

export default mongoose.models.BannedIP || mongoose.model('BannedIP', BannedIPSchema);
