const router = require('express').Router();
const { listReminders, createReminder, takeMedicine } = require('../controllers/reminder.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('patient'), listReminders);
router.post('/', authenticate, authorize('patient'), createReminder);
router.patch('/:id/take', authenticate, authorize('patient'), takeMedicine);

module.exports = router;
