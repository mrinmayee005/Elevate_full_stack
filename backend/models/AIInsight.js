const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  feature: { type: String, required: true },
  prompt: String,
  response: { type: String, required: true },
  language: String
}, { timestamps: true });

module.exports = mongoose.model('AIInsight', aiInsightSchema);
