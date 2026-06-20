const router = require('express').Router();
const { listDepartments, doctorsByDepartment } = require('../controllers/department.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, listDepartments);
router.get('/:id/doctors', authenticate, doctorsByDepartment);

module.exports = router;
