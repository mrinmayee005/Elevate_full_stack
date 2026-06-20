const Message = require('../models/Message');
const { emitToUser, emitToDepartment } = require('../socket');

async function createMessage(req, res, next) {
  try {
    const payload = { ...req.body, from: req.user._id };
    if (!payload.to) delete payload.to;
    if (!payload.department) delete payload.department;
    const message = await Message.create(payload);
    const populated = await message.populate(['from', 'to', 'department']);
    if (message.to) emitToUser(message.to, 'message:new', populated);
    if (message.department) emitToDepartment(message.department, 'message:new', populated);
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

async function listMessages(req, res, next) {
  try {
    const query = req.query.department
      ? { department: req.query.department }
      : req.query.with
        ? { $or: [{ from: req.user._id, to: req.query.with }, { from: req.query.with, to: req.user._id }] }
        : { $or: [{ from: req.user._id }, { to: req.user._id }] };
    res.json(await Message.find(query).populate(['from', 'to', 'department']).sort({ createdAt: -1 }).limit(100));
  } catch (error) {
    next(error);
  }
}

module.exports = { createMessage, listMessages };
