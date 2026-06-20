const Appointment = require('../models/Appointment');
const Department = require('../models/Department');
const Bed = require('../models/Bed');
const NurseTask = require('../models/NurseTask');
const { availableSlots, nextQueueNumber, refreshQueue } = require('../services/queue.service');
const { notifyUser, notifyRole } = require('../services/notification.service');
const { emitToUser, emitAll } = require('../socket');

async function slots(req, res, next) {
  try {
    res.json({ slots: await availableSlots(req.query.doctor, req.query.date) });
  } catch (error) {
    next(error);
  }
}

async function book(req, res, next) {
  try {
    const { doctor, department, date, slot, reason } = req.body;
    if (!(await availableSlots(doctor, date)).includes(slot)) {
      const error = new Error('Slot is already booked');
      error.status = 409;
      throw error;
    }
    const queueNumber = await nextQueueNumber(doctor, date);
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor,
      department,
      date,
      slot,
      queueNumber,
      livePosition: queueNumber,
      estimatedWaitingMinutes: Math.max(queueNumber - 1, 0) * 20,
      reason
    });
    await notifyUser(req.user._id, {
      type: 'appointment-confirmed',
      title: 'Appointment confirmed',
      message: `Queue number ${queueNumber}. Estimated wait ${appointment.estimatedWaitingMinutes} minutes.`,
      severity: 'Info'
    });
    emitToUser(doctor, 'appointment:new', await appointment.populate(['patient', 'doctor', 'department']));
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const query = {};
    if (req.user.role === 'patient') query.patient = req.user._id;
    if (req.user.role === 'doctor') query.doctor = req.user._id;
    if (req.query.status) query.status = req.query.status;
    if (req.query.date) query.date = req.query.date;
    res.json(await Appointment.find(query).populate(['patient', 'doctor', 'department']).sort({ date: 1, queueNumber: 1 }));
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate(['patient', 'doctor', 'department']);
    await refreshQueue(appointment.doctor._id, appointment.date);
    res.json(appointment);
  } catch (error) {
    next(error);
  }
}

async function detail(req, res, next) {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(['patient', 'doctor', 'department']);
    if (!appointment) {
      const error = new Error('Appointment not found');
      error.status = 404;
      throw error;
    }
    if (req.user.role === 'doctor' && String(appointment.doctor._id) !== String(req.user._id)) {
      const error = new Error('Forbidden');
      error.status = 403;
      throw error;
    }
    if (req.user.role === 'patient' && String(appointment.patient._id) !== String(req.user._id)) {
      const error = new Error('Forbidden');
      error.status = 403;
      throw error;
    }
    res.json(appointment);
  } catch (error) {
    next(error);
  }
}

async function followUp(req, res, next) {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, doctor: req.user._id }).populate(['patient', 'doctor']);
    if (!appointment) {
      const error = new Error('Appointment not found');
      error.status = 404;
      throw error;
    }
    const { followUpDate, instructions } = req.body;
    await notifyUser(appointment.patient._id, {
      type: 'follow-up',
      title: 'Follow-up scheduled',
      message: `Dr. ${appointment.doctor.name} scheduled your follow-up for ${followUpDate}. ${instructions || ''}`,
      severity: 'Info'
    });
    emitToUser(appointment.patient._id, 'followup:new', { appointmentId: appointment._id, followUpDate, instructions });
    res.json({ ok: true, followUpDate, instructions });
  } catch (error) {
    next(error);
  }
}

async function admit(req, res, next) {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, doctor: req.user._id }).populate(['patient', 'doctor', 'department']);
    if (!appointment) {
      const error = new Error('Appointment not found');
      error.status = 404;
      throw error;
    }
    const bedType = req.body.bedType === 'ICU' ? 'ICU' : 'General';
    const bed = await Bed.findOneAndUpdate(
      { type: bedType, status: 'available' },
      {
        status: 'occupied',
        patient: appointment.patient._id,
        assignedDoctor: req.user._id,
        department: appointment.department._id,
        ward: req.body.ward || `${bedType} Ward`,
        admissionReason: req.body.reason || appointment.reason,
        emergency: Boolean(req.body.emergency),
        admittedAt: new Date(),
        dischargedAt: null
      },
      { new: true, sort: { code: 1 } }
    ).populate(['patient', 'assignedDoctor', 'department']);
    if (!bed) {
      const error = new Error(`No ${bedType} bed is currently available`);
      error.status = 409;
      throw error;
    }
    await notifyUser(appointment.patient._id, {
      type: 'admission',
      title: 'Patient admitted',
      message: `You have been admitted to ${bed.ward}, bed ${bed.code}.`,
      severity: req.body.emergency ? 'High' : 'Info'
    });
    await notifyRole('nurse', {
      type: 'admission',
      title: 'New admitted patient',
      message: `${appointment.patient.name} admitted to ${bed.ward}, bed ${bed.code}.`,
      severity: req.body.emergency ? 'Critical' : 'High'
    });
    await maybeLowBedAlert(bedType);
    emitAll('admission:new', bed);
    res.status(201).json(bed);
  } catch (error) {
    next(error);
  }
}

async function doctorStats(req, res, next) {
  try {
    const [admitted, completed, emergency] = await Promise.all([
      Bed.countDocuments({ assignedDoctor: req.user._id, status: 'occupied' }),
      Appointment.countDocuments({ doctor: req.user._id, status: 'completed' }),
      Bed.countDocuments({ assignedDoctor: req.user._id, status: 'occupied', emergency: true })
    ]);
    res.json({ admitted, completed, emergency });
  } catch (error) {
    next(error);
  }
}

async function assignNurseTask(req, res, next) {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, doctor: req.user._id }).populate(['patient', 'department']);
    if (!appointment) {
      const error = new Error('Appointment not found');
      error.status = 404;
      throw error;
    }
    const bed = await Bed.findOne({ patient: appointment.patient._id, status: 'occupied' });
    const task = await NurseTask.create({
      patient: appointment.patient._id,
      doctor: req.user._id,
      department: appointment.department?._id,
      bed: bed?._id,
      title: req.body.title,
      detail: req.body.detail,
      priority: req.body.priority || 'Medium'
    });
    await notifyRole('nurse', {
      type: 'nurse-task',
      title: 'New doctor task',
      message: `${req.body.title} for ${appointment.patient.name}`,
      severity: task.priority
    });
    emitAll('nurseTask:new', await task.populate(['patient', 'doctor', 'bed']));
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
}

async function maybeLowBedAlert(type) {
  const available = await Bed.countDocuments({ type, status: 'available' });
  if (available <= 2) {
    await notifyRole('admin', {
      type: 'low-bed',
      title: 'Low bed availability',
      message: `Only ${available} ${type} bed(s) remain available.`,
      severity: 'High'
    });
    emitAll('bed:low', { type, available });
  }
}

async function reschedule(req, res, next) {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
    if (!appointment) {
      const error = new Error('Appointment not found');
      error.status = 404;
      throw error;
    }
    if (!(await availableSlots(appointment.doctor, req.body.date)).includes(req.body.slot)) {
      const error = new Error('Requested slot is unavailable');
      error.status = 409;
      throw error;
    }
    appointment.date = req.body.date;
    appointment.slot = req.body.slot;
    appointment.status = 'booked';
    await appointment.save();
    emitToUser(appointment.doctor, 'appointment:rescheduled', appointment);
    res.json(appointment);
  } catch (error) {
    next(error);
  }
}

async function cancel(req, res, next) {
  try {
    const appointment = await Appointment.findOneAndUpdate({ _id: req.params.id, patient: req.user._id }, { status: 'cancelled' }, { new: true });
    await refreshQueue(appointment.doctor, appointment.date);
    res.json(appointment);
  } catch (error) {
    next(error);
  }
}

module.exports = { slots, book, list, detail, updateStatus, followUp, admit, doctorStats, assignNurseTask, reschedule, cancel };
