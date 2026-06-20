const Department = require('../models/Department');
const User = require('../models/User');

const DEPARTMENTS = ['Cardiology', 'Neurology', 'Orthopedics', 'Dermatology', 'Pediatrics', 'Gynecology', 'General Medicine', 'Emergency'];

async function seedDepartments() {
  for (const name of DEPARTMENTS) {
    await Department.updateOne({ name }, { $setOnInsert: { name, description: `${name} department` } }, { upsert: true });
  }
}

async function listDepartments(_req, res, next) {
  try {
    await seedDepartments();
    res.json(await Department.find().sort('name'));
  } catch (error) {
    next(error);
  }
}

async function doctorsByDepartment(req, res, next) {
  try {
    const department = await Department.findById(req.params.id);
    const doctors = await User.find({ role: 'doctor', department: department._id, active: true }).select('-password').populate('department');
    res.json(doctors);
  } catch (error) {
    next(error);
  }
}

module.exports = { listDepartments, doctorsByDepartment, seedDepartments };
