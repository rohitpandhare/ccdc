const express = require('express');
const router = express.Router();
const { checkRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.get('/', checkRole(['admin']), adminController.getDashboard);
router.post('/delete-user/:id', checkRole(['admin']), adminController.deleteUser);
router.post('/delete-doctor/:id', checkRole(['admin']), adminController.deleteDoctor);
router.post('/delete-patient/:id', checkRole(['admin']), adminController.deletePatient);

module.exports = router;
