const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
const { env } = require('../config/env');

function sign(user) {
  return jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: '7d' });
}

async function ensureAdmin() {
  const existing = await User.findOne({ username: 'admin', role: 'admin' });
  if (!existing) await User.create({ name: 'Hospital Admin', username: 'admin', password: 'admin@123', role: 'admin' });
}

async function signup(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      department,
      specialization,
      language,
      licenseNumber,
      experienceYears,
      consultationRoom,
      qualification,
      shift,
      ward,
      occupation,
      age,
      gender,
      bloodGroup,
      address,
      allergies,
      emergencyContact
    } = req.body;
    if (!['doctor', 'nurse', 'patient'].includes(role)) {
      const error = new Error('Signup is allowed only for doctor, nurse, and patient roles');
      error.status = 400;
      throw error;
    }
    if ((role === 'doctor' || role === 'nurse') && !department) {
      const error = new Error('Department is required for doctor and nurse signup');
      error.status = 400;
      throw error;
    }
    if (role === 'doctor' && !specialization) {
      const error = new Error('Specialization is required for doctor signup');
      error.status = 400;
      throw error;
    }
    const dept = department
      ? await Department.findOneAndUpdate(
          { name: department },
          { $setOnInsert: { name: department, description: `${department} department` } },
          { upsert: true, new: true }
        )
      : null;
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      department: dept?._id,
      specialization,
      language,
      licenseNumber,
      experienceYears,
      consultationRoom,
      qualification,
      shift,
      ward,
      occupation,
      age,
      gender,
      bloodGroup,
      address,
      allergies: typeof allergies === 'string' ? allergies.split(',').map((item) => item.trim()).filter(Boolean) : allergies,
      emergencyContact
    });
    res.status(201).json({ token: sign(user), user: await User.findById(user._id).select('-password').populate('department') });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    await ensureAdmin();
    const { email, username, password } = req.body;
    const query = username ? { username: username.toLowerCase() } : { email: email?.toLowerCase() };
    const user = await User.findOne(query).populate('department');
    if (!user || !(await user.comparePassword(password))) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }
    res.json({ token: sign(user), user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { signup, login, me, ensureAdmin };
