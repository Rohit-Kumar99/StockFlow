const AuditLog = require('../models/AuditLog');

const logAudit = async ({ action, entityType, entityId, performedBy, details }) => {
  try {
    await AuditLog.create({
      action,
      entityType,
      entityId,
      performedBy,
      details,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = logAudit;
