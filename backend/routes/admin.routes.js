const router = require('express').Router();
const { analytics, createPatient } = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/analytics', authenticate, authorize('admin'), analytics);
router.post('/patients', authenticate, authorize('admin'), createPatient);

module.exports = router;
