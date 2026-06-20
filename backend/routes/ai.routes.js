const router = require('express').Router();
const { textAI, medicineScan } = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/text', authenticate, textAI);
router.post('/medicine-scan', authenticate, upload.single('image'), medicineScan);

module.exports = router;
