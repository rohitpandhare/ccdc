// const express = require('express');
// const router = express.Router();
// const { checkAuth } = require('../middleware/auth');
// const patientController = require('../controllers/patientAuth');

// router.get('/dashboard', checkAuth, async (req, res) => {
//     try {
//         const dashboardData = await patientController.getPatientDashboard(req.session.user.PatientID);
//         res.render('users/patient', dashboardData);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// router.get('/prescriptions', checkAuth, async (req, res) => {
//     try {
//         const [prescriptions] = await conPool.promise().query(
//             `SELECT p.*, d.Name as DoctorName
//              FROM PRESCRIPTION p
//              JOIN DOCTOR d ON p.DoctorID = d.DoctorID
//              WHERE p.PatientID = ?
//              ORDER BY p.DateIssued DESC`,
//             [req.session.user.PatientID]
//         );
//         res.json(prescriptions);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// module.exports = router;
