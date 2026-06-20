const router = require('express').Router();
const { createVital, listVitals, assignedPatients, tasks, upsertBed, listBeds } = require('../controllers/nurse.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/vitals', authenticate, authorize('nurse', 'doctor'), listVitals);
router.post('/vitals', authenticate, authorize('nurse'), createVital);
router.get('/assigned-patients', authenticate, authorize('nurse'), assignedPatients);
router.get('/tasks', authenticate, authorize('nurse'), tasks);
router.get('/beds', authenticate, listBeds);
router.post('/beds', authenticate, authorize('nurse', 'admin'), upsertBed);

module.exports = router;
