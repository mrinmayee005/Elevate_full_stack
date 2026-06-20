const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['General', 'ICU', 'Emergency'], required: true },
  status: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedNurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  ward: String,
  admissionReason: String,
  emergency: { type: Boolean, default: false },
  admittedAt: Date,
  dischargedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Bed', bedSchema);
