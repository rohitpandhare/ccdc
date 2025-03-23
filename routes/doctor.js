const express = require('express');
const router = express.Router();

const { 
    getPatients,
    createPrescription 
} = require('../controllers/doctorAuth');

// Middleware to check if user is a doctor
const isDoctorMiddleware = (req, res, next) => {
    if (req.session.user && req.session.user.Role === 'doctor') {
        next();
    } else {
        res.status(403).render('checks/error', { 
            message: 'Access denied. Doctor privileges required.' 
        });
    }
};

// Apply doctor middleware to all routes
router.use(isDoctorMiddleware);

// Doctor routes
router.get('/patients', getPatients);
router.post('/prescription/create', createPrescription);

module.exports = router;
