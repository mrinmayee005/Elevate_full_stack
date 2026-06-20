const router = require('express').Router();
const { createMessage, listMessages } = require('../controllers/message.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('doctor', 'nurse', 'patient'), listMessages);
router.post('/', authenticate, authorize('doctor', 'nurse', 'patient'), createMessage);

module.exports = router;
