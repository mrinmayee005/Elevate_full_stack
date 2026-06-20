const router = require('express').Router();
const { signup, login, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticate, me);

module.exports = router;
