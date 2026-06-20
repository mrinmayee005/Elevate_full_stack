const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  date: { type: String, required: true },
  slot: { type: String, required: true },
  queueNumber: { type: Number, required: true },
  estimatedWaitingMinutes: { type: Number, default: 0 },
  status: { type: String, enum: ['booked', 'rescheduled', 'cancelled', 'completed'], default: 'booked' },
  livePosition: { type: Number, default: 0 },
  notifiedFiveAhead: { type: Boolean, default: false },
  reason: String
}, { timestamps: true });

appointmentSchema.index({ doctor: 1, date: 1, slot: 1 }, { unique: true, partialFilterExpression: { status: 'booked' } });
appointmentSchema.index({ patient: 1, date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
