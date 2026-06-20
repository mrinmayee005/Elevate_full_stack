const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bloodPressure: String,
  temperature: Number,
  pulse: Number,
  oxygenLevel: Number,
  riskLevel: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Low' },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Vital', vitalSchema);
