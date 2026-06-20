const Notification = require('../models/Notification');
const { emitToUser, emitToRole } = require('../socket');

async function notifyUser(userId, payload) {
  const notification = await Notification.create({ user: userId, ...payload });
  emitToUser(userId, 'notification:new', notification);
  return notification;
}

async function notifyRole(role, payload) {
  const notification = await Notification.create({ role, ...payload });
  emitToRole(role, 'notification:new', notification);
  return notification;
}

module.exports = { notifyUser, notifyRole };
