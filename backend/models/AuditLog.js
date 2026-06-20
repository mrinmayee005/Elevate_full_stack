const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entity: String,
  entityId: String,
  metadata: Object
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
