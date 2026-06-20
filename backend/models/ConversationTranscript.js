const mongoose = require('mongoose');

const conversationTranscriptSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transcript: { type: String, required: true },
  language: { type: String, default: 'English' },
  aiInsights: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ConversationTranscript', conversationTranscriptSchema);
