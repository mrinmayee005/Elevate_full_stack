const { notifyRole } = require('../services/notification.service');
const { emitToRole, emitToUser } = require('../socket');
const Appointment = require('../models/Appointment');
const Bed = require('../models/Bed');
const NurseTask = require('../models/NurseTask');

async function triggerEmergency(req, res, next) {
  try {
    let assignedDoctor;
    if (req.user.role === 'patient') {
      const appointment = await Appointment.findOne({ patient: req.user._id, status: 'booked' }).sort({ date: -1 }).populate('doctor');
      assignedDoctor = appointment?.doctor;
    }
    const payload = {
      type: 'emergency',
      title: 'Emergency alert',
      message: req.body.message || `${req.user.name} needs emergency help.`,
      severity: 'Critical'
    };
    const notification = await notifyRole('nurse', payload);
    if (assignedDoctor) emitToUser(assignedDoctor._id, 'emergency:alert', { ...payload, patient: req.user._id, voice: payload.message, flash: true });
    emitToRole('nurse', 'emergency:alert', {
      ...payload,
      doctor: req.user.name,
      patient: req.body.patient,
      voice: payload.message,
      flash: true
    });
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
}

async function voiceCommand(req, res, next) {
  try {
    const command = String(req.body.command || '').toLowerCase();
    const bedType = command.includes('icu') ? 'ICU' : 'General';
    const wardMatch = command.match(/ward\s+([a-z0-9-]+)/i);
    const patientName = command.match(/patient\s+([a-z ]+?)\s+(in|to|ward|icu|general|$)/i)?.[1]?.trim();
    const appointments = await Appointment.find({ doctor: req.user._id, status: 'booked' }).populate(['patient', 'department']);
    const appointment = appointments.find((item) => item.patient.name.toLowerCase().includes(patientName || '')) || appointments[0];
    if (!appointment) {
      const error = new Error('No active appointment found for voice admission command');
      error.status = 404;
      throw error;
    }
    const bed = await Bed.findOneAndUpdate(
      { type: bedType, status: 'available' },
      {
        status: 'occupied',
        patient: appointment.patient._id,
        assignedDoctor: req.user._id,
        department: appointment.department?._id,
        ward: wardMatch ? `Ward ${wardMatch[1]}` : `${bedType} Ward`,
        admissionReason: `Voice command: ${req.body.command}`,
        emergency: true,
        admittedAt: new Date()
      },
      { new: true, sort: { code: 1 } }
    ).populate(['patient', 'assignedDoctor', 'department']);
    if (!bed) {
      const error = new Error(`No ${bedType} bed is available`);
      error.status = 409;
      throw error;
    }
    await NurseTask.create({
      patient: appointment.patient._id,
      doctor: req.user._id,
      department: appointment.department?._id,
      bed: bed._id,
      title: 'Emergency admission check',
      detail: `Voice command admission to ${bed.ward}, bed ${bed.code}`,
      priority: 'Critical'
    });
    emitToRole('nurse', 'emergency:alert', {
      title: 'Voice emergency admission',
      message: `${appointment.patient.name} admitted to ${bed.ward}, bed ${bed.code}.`,
      severity: 'Critical',
      voice: `${appointment.patient.name} admitted to ${bed.ward}, bed ${bed.code}.`
    });
    res.json(bed);
  } catch (error) {
    next(error);
  }
}

module.exports = { triggerEmergency, voiceCommand };
