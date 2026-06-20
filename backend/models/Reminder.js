const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  medicineName: String,
  schedule: [String],
  quantityTotal: { type: Number, default: 0 },
  quantityLeft: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 3 },
  instructions: String,
  nextAt: Date,
  status: { type: String, enum: ['pending', 'sent', 'completed', 'missed', 'low-stock'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
