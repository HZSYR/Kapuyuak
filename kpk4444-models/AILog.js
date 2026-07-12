import mongoose from 'mongoose';

const aiLogSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['INFO', 'WARN', 'ERROR', 'SUCCESS', 'BLOCKED'],
    default: 'INFO'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.AILog || mongoose.model('AILog', aiLogSchema);
