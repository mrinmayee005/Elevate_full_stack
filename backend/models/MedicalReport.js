const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  diagnosis: String,
  notes: String,
  doctorNotepad: String,
  followUpDate: String,
  files: [{ url: String, publicId: String, type: String, name: String }],
  aiSimplification: String
}, { timestamps: true });

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
