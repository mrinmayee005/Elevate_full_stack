const dotenv = require('dotenv');
dotenv.config();

const connectDatabase = require('./connect');
const User = require('../models/User');
const Department = require('../models/Department');
const Bed = require('../models/Bed');
const { seedDepartments } = require('../controllers/department.controller');
const { ensureAdmin } = require('../controllers/auth.controller');

async function upsertUser(data) {
  const existing = await User.findOne({ email: data.email });
  if (!existing) await User.create(data);
}

async function seed() {
  await connectDatabase();
  await seedDepartments();
  await ensureAdmin();
  const general = await Department.findOne({ name: 'General Medicine' });
  const emergency = await Department.findOne({ name: 'Emergency' });
  await upsertUser({ name: 'Dr. Asha Mehta', email: 'doctor@hospital2050.com', password: 'doctor@123', role: 'doctor', department: general._id, specialization: 'Internal Medicine' });
  await upsertUser({ name: 'Nurse Riya Shah', email: 'nurse@hospital2050.com', password: 'nurse@123', role: 'nurse', department: emergency._id });
  await upsertUser({ name: 'Patient Demo', email: 'patient@hospital2050.com', password: 'patient@123', role: 'patient', language: 'English' });
  for (const bed of [
    { code: 'G-101', type: 'General', status: 'available' },
    { code: 'G-102', type: 'General', status: 'occupied' },
    { code: 'ICU-1', type: 'ICU', status: 'available' },
    { code: 'ER-1', type: 'Emergency', status: 'available' }
  ]) {
    await Bed.updateOne({ code: bed.code }, bed, { upsert: true });
  }
  console.log('Seed complete');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
