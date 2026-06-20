const router = require('express').Router();
const { listUsers, assignedPatients, updateMe } = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin', 'doctor', 'nurse', 'patient'), listUsers);
router.patch('/me', authenticate, updateMe);
router.get('/assigned-patients', authenticate, authorize('doctor'), assignedPatients);

module.exports = router;
