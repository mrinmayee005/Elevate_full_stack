const User = require('../models/User');

async function listUsers(req, res, next) {
  try {
    const query = req.query.role ? { role: req.query.role } : {};
    if (req.user.role === 'patient' && !['doctor', 'nurse'].includes(req.query.role)) {
      const error = new Error('Patients can only search care team members');
      error.status = 403;
      throw error;
    }
    res.json(await User.find(query).select('-password').populate('department').sort('name'));
  } catch (error) {
    next(error);
  }
}

async function assignedPatients(req, res, next) {
  try {
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({ doctor: req.user._id }).populate('patient', '-password').sort({ date: -1 });
    const unique = new Map(appointments.map((a) => [String(a.patient._id), a.patient]));
    res.json([...unique.values()]);
  } catch (error) {
    next(error);
  }
}

async function updateMe(req, res, next) {
  try {
    const allowed = ['language', 'phone', 'address', 'emergencyContact'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password').populate('department');
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = { listUsers, assignedPatients, updateMe };
