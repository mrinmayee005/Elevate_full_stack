const router = require('express').Router();
const { slots, book, list, detail, updateStatus, followUp, admit, doctorStats, assignNurseTask, reschedule, cancel } = require('../controllers/appointment.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, list);
router.get('/slots', authenticate, slots);
router.get('/doctor-stats', authenticate, authorize('doctor'), doctorStats);
router.post('/', authenticate, authorize('patient'), book);
router.get('/:id', authenticate, detail);
router.patch('/:id/status', authenticate, authorize('doctor'), updateStatus);
router.post('/:id/follow-up', authenticate, authorize('doctor'), followUp);
router.post('/:id/admit', authenticate, authorize('doctor'), admit);
router.post('/:id/nurse-task', authenticate, authorize('doctor'), assignNurseTask);
router.patch('/:id/reschedule', authenticate, authorize('patient'), reschedule);
router.patch('/:id/cancel', authenticate, authorize('patient'), cancel);

module.exports = router;
