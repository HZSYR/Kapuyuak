import mongoose from 'mongoose';

const groqKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.GroqKey || mongoose.model('GroqKey', groqKeySchema);
