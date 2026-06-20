const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, trim: true, lowercase: true, index: true },
  email: { type: String, trim: true, lowercase: true, sparse: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'doctor', 'nurse', 'patient'], required: true },
  phone: String,
  language: { type: String, default: 'English' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  specialization: String,
  licenseNumber: String,
  experienceYears: Number,
  consultationRoom: String,
  qualification: String,
  shift: { type: String, enum: ['Morning', 'Evening', 'Night', 'Rotational'] },
  ward: String,
  occupation: String,
  age: Number,
  gender: { type: String, enum: ['Female', 'Male', 'Other', 'Prefer not to say'] },
  bloodGroup: String,
  address: String,
  allergies: [String],
  emergencyContact: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
