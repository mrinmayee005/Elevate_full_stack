const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['admin', 'doctor', 'nurse', 'patient'] },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low', 'Info'], default: 'Info' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
