const router = require('express').Router();
const { createConversationInsight, listConversationInsights } = require('../controllers/conversation.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('doctor', 'patient'), listConversationInsights);
router.post('/', authenticate, authorize('doctor'), createConversationInsight);

module.exports = router;
