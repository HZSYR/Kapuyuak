import mongoose from 'mongoose';

const kapuyuakAISchema = new mongoose.Schema({
  configId: { type: String, required: true, unique: true, default: 'global' },
  activeEngine: { type: String, enum: ['GROQ', 'KAPUYUAK'], default: 'GROQ' },
  modelState: { type: String, default: '' }, // Disimpan sebagai serialisasi JSON oleh module 'bayes'
  trainingSamples: { type: Number, default: 0 },
  lastTrainedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.KapuyuakAI || mongoose.model('KapuyuakAI', kapuyuakAISchema);
