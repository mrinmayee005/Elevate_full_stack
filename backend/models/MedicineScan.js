const mongoose = require('mongoose');

const medicineScanSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  image: { url: String, publicId: String },
  language: String,
  aiResult: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('MedicineScan', medicineScanSchema);
