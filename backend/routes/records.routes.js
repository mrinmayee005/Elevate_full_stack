const router = require('express').Router();
const {
  createReport,
  listReports,
  createPrescription,
  listPrescriptions,
  downloadPrescription,
  simplifyPrescription,
  simplifyReport,
  scanPrescription
} = require('../controllers/records.controller');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/reports', authenticate, listReports);
router.post('/reports', authenticate, authorize('doctor'), upload.array('files', 5), createReport);
router.post('/reports/:id/simplify', authenticate, simplifyReport);
router.get('/prescriptions', authenticate, listPrescriptions);
router.post('/prescriptions', authenticate, authorize('doctor'), createPrescription);
router.get('/prescriptions/:id/download', authenticate, downloadPrescription);
router.post('/prescriptions/:id/simplify', authenticate, simplifyPrescription);
router.post('/prescriptions/scan', authenticate, authorize('patient'), upload.single('image'), scanPrescription);

module.exports = router;
