const router = require('express').Router();
const { triggerEmergency, voiceCommand } = require('../controllers/emergency.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('doctor', 'patient'), triggerEmergency);
router.post('/voice-command', authenticate, authorize('doctor'), voiceCommand);

module.exports = router;
