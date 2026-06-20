const User = require('../models/User');
const Bed = require('../models/Bed');
const Appointment = require('../models/Appointment');
const Department = require('../models/Department');
const Vital = require('../models/Vital');
const { notifyRole } = require('../services/notification.service');

async function analytics(_req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [totalDoctors, totalNurses, totalPatients, availableBeds, occupiedBeds, admittedPatients, todaysAppointments, criticalCases, departments] = await Promise.all([
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'nurse' }),
      User.countDocuments({ role: 'patient' }),
      Bed.countDocuments({ status: 'available' }),
      Bed.countDocuments({ status: 'occupied' }),
      Bed.countDocuments({ status: 'occupied', patient: { $exists: true, $ne: null } }),
      Appointment.countDocuments({ date: today, status: { $ne: 'cancelled' } }),
      Vital.countDocuments({ riskLevel: 'Critical' }),
      Department.find()
    ]);

    const departmentAnalytics = [];
    for (const department of departments) {
      departmentAnalytics.push({
        department: department.name,
        doctors: await User.countDocuments({ role: 'doctor', department: department._id }),
        appointments: await Appointment.countDocuments({ department: department._id }),
        patients: (await Appointment.distinct('patient', { department: department._id })).length
      });
    }

    const doctorAnalytics = await User.aggregate([
      { $match: { role: 'doctor' } },
      { $lookup: { from: 'appointments', localField: '_id', foreignField: 'doctor', as: 'appointments' } },
      { $project: { name: 1, appointmentCount: { $size: '$appointments' }, patientCount: { $size: { $setUnion: ['$appointments.patient', []] } } } }
    ]);

    const beds = await Bed.find().populate(['patient', 'assignedDoctor', 'department']);
    const icuTotal = beds.filter((b) => b.type === 'ICU').length;
    const icuOccupied = beds.filter((b) => b.type === 'ICU' && b.status === 'occupied').length;
    const emergencyAvailable = beds.filter((b) => b.type === 'Emergency' && b.status === 'available').length;

    res.json({
      totals: { totalDoctors, totalNurses, totalPatients, availableBeds, occupiedBeds, admittedPatients, todaysAppointments, criticalCases },
      departmentAnalytics,
      doctorAnalytics,
      nurseAnalytics: await User.find({ role: 'nurse' }).select('name').lean(),
      bedAnalytics: {
        occupancyRate: beds.length ? Math.round((occupiedBeds / beds.length) * 100) : 0,
        icuUsage: icuTotal ? Math.round((icuOccupied / icuTotal) * 100) : 0,
        emergencyBedAvailability: emergencyAvailable
      },
      admitted: beds.filter((bed) => bed.status === 'occupied' && bed.patient)
    });
  } catch (error) {
    next(error);
  }
}

async function createPatient(req, res, next) {
  try {
    const password = req.body.password || `patient@${Math.floor(1000 + Math.random() * 9000)}`;
    const patient = await User.create({
      ...req.body,
      password,
      role: 'patient'
    });
    await notifyRole('admin', {
      type: 'patient-created',
      title: 'Patient added',
      message: `${patient.name} was added by admin.`,
      severity: 'Info'
    });
    res.status(201).json({ patient: await User.findById(patient._id).select('-password'), temporaryPassword: password });
  } catch (error) {
    next(error);
  }
}

module.exports = { analytics, createPatient };
