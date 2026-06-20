const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  bed: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', required: true },
  ward: String,
  reason: String,
  emergency: { type: Boolean, default: false },
  admittedAt: { type: Date, default: Date.now },
  dischargedAt: Date,
  status: { type: String, enum: ['admitted', 'discharged'], default: 'admitted' }
}, { timestamps: true });

module.exports = mongoose.model('Admission', admissionSchema);
