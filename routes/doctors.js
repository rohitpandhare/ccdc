// const express = require('express');
// const router = express.Router();
// const { checkAuth } = require('../middleware/auth');
// const doctorController = require('../controllers/doctorAuth');

// router.get('/dashboard', checkAuth, async (req, res) => {
//     try {
//         const stats = await doctorController.getDashboardStats(req.session.user.DoctorID);
//         res.render('users/doctor', { stats });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// router.get('/patients', checkAuth, async (req, res) => {
//     try {
//         const [patients] = await conPool.promise().query(
//             `SELECT p.*, dp.FirstConsultation
//              FROM PATIENT p
//              JOIN DOCTOR_PATIENT dp ON p.PatientID = dp.PatientID
//              WHERE dp.DoctorID = ?`,
//             [req.session.user.DoctorID]
//         );
//         res.json(patients);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// module.exports = router;
