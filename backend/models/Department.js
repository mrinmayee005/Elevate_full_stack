const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['Cardiology', 'Neurology', 'Orthopedics', 'Dermatology', 'Pediatrics', 'Gynecology', 'General Medicine', 'Emergency'],
    required: true,
    unique: true
  },
  description: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
