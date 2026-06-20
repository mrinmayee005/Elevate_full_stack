const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  medicines: [{
    name: String,
    dosage: String,
    doseCount: String,
    timing: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  hospitalName: { type: String, default: 'LifeCare Hospital' },
  notes: String,
  followUpDate: String,
  aiSimplification: String
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
