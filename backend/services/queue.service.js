const Appointment = require('../models/Appointment');
const { notifyUser } = require('./notification.service');
const { emitToUser, emitToDepartment } = require('../socket');

const DEFAULT_SLOTS = ['09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00', '11:20', '11:40', '12:00', '14:00', '14:20', '14:40', '15:00', '15:20', '15:40', '16:00'];

async function availableSlots(doctor, date) {
  const booked = await Appointment.find({ doctor, date, status: { $ne: 'cancelled' } }).distinct('slot');
  return DEFAULT_SLOTS.filter((slot) => !booked.includes(slot));
}

async function nextQueueNumber(doctor, date) {
  const last = await Appointment.findOne({ doctor, date }).sort({ queueNumber: -1 });
  return last ? last.queueNumber + 1 : 1;
}

async function refreshQueue(doctor, date) {
  const active = await Appointment.find({ doctor, date, status: 'booked' }).sort({ queueNumber: 1 });
  for (let index = 0; index < active.length; index += 1) {
    const appointment = active[index];
    const position = index + 1;
    appointment.livePosition = position;
    appointment.estimatedWaitingMinutes = Math.max(position - 1, 0) * 20;
    if (position === 6 && !appointment.notifiedFiveAhead) {
      appointment.notifiedFiveAhead = true;
      await notifyUser(appointment.patient, {
        type: 'queue-five-ahead',
        title: 'Queue alert',
        message: 'Only 5 patients remain before your consultation.',
        severity: 'High'
      });
      emitToUser(appointment.patient, 'queue:fiveAhead', { appointmentId: appointment._id, message: 'Only 5 patients remain before your consultation.' });
    }
    await appointment.save();
    emitToUser(appointment.patient, 'queue:update', appointment);
  }
  if (active[0]) emitToDepartment(active[0].department, 'queue:doctorUpdate', { doctor, date, queue: active });
}

module.exports = { DEFAULT_SLOTS, availableSlots, nextQueueNumber, refreshQueue };
