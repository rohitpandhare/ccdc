const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicAccess');

// Public routes - no authentication needed
router.get('/doctors', publicController.getDoctorDirectory);
router.get('/doctors/search', publicController.searchDoctors);
router.get('/doctors/top-rated', publicController.getTopDoctors);
router.get('/prescription/:globalRefId', publicController.getPublicPrescription);

module.exports = router;
