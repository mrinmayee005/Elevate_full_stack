const Reminder = require('../models/Reminder');
const { notifyUser } = require('../services/notification.service');
const { emitToUser } = require('../socket');

async function listReminders(req, res, next) {
  try {
    res.json(await Reminder.find({ patient: req.user._id }).populate('prescription').sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
}

async function createReminder(req, res, next) {
  try {
    const reminder = await Reminder.create({ ...req.body, patient: req.user._id });
    res.status(201).json(reminder);
  } catch (error) {
    next(error);
  }
}

async function takeMedicine(req, res, next) {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, patient: req.user._id });
    if (!reminder) {
      const error = new Error('Reminder not found');
      error.status = 404;
      throw error;
    }
    reminder.quantityLeft = Math.max(Number(reminder.quantityLeft || 0) - Number(req.body.amount || 1), 0);
    reminder.status = reminder.quantityLeft <= reminder.lowStockThreshold ? 'low-stock' : 'completed';
    await reminder.save();
    if (reminder.status === 'low-stock') {
      const payload = {
        type: 'medicine-low-stock',
        title: 'Medicine running low',
        message: `${reminder.medicineName} is low. Quantity left: ${reminder.quantityLeft}.`,
        severity: 'High'
      };
      await notifyUser(req.user._id, payload);
      emitToUser(req.user._id, 'medicine:lowStock', payload);
    }
    res.json(reminder);
  } catch (error) {
    next(error);
  }
}

module.exports = { listReminders, createReminder, takeMedicine };
