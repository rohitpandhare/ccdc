// const { sendResponse } = require('./auth');
// const { conPool } = require('../config/db');

// const patientController = {
//     getMyAppointments: async (req, res) => {
//         const patientId = req.session.user.UserID;
//         try {
//             const [appointments] = await conPool.promise().query(
//                 'SELECT * FROM appointments WHERE PatientID = ?',
//                 [patientId]
//             );
//             sendResponse(res, "Appointments retrieved", appointments);
//         } catch (err) {
//             sendResponse(res, "Error fetching appointments", err.message, true, 500);
//         }
//     },
//     getMyPrescriptions: async (req, res) => {
//         const patientId = req.session.user.UserID;
//         try {
//             const [prescriptions] = await conPool.promise().query(
//                 'SELECT * FROM prescriptions WHERE PatientID = ?',
//                 [patientId]
//             );
//             res.json({ success: true, data: prescriptions });
//         } catch (err) {
//             res.status(500).json({ success: false, error: err.message });
//         }
//     },

//     bookAppointment: async (req, res) => {
//         const { doctorId, appointmentDate } = req.body;
//         const patientId = req.session.user.UserID;
//         try {
//             const [result] = await conPool.promise().query(
//                 'INSERT INTO appointments (DoctorID, PatientID, AppointmentDate) VALUES (?, ?, ?)',
//                 [doctorId, patientId, appointmentDate]
//             );
//             res.json({ success: true, data: result });
//         } catch (err) {
//             res.status(500).json({ success: false, error: err.message });
//         }
//     },
//     getPatientDashboard: async(patientId) =>{
//         try {
//             // Get active prescriptions
//             const [activePrescriptions] = await conPool.promise().query(
//                 `SELECT p.*, d.Name as DoctorName
//                  FROM PRESCRIPTION p
//                  JOIN DOCTOR d ON p.DoctorID = d.DoctorID
//                  WHERE p.PatientID = ? AND p.Status = 'ACTIVE'`,
//                 [patientId]
//             );

//             // Get medical history
//             const [medicalHistory] = await conPool.promise().query(
//                 `SELECT mr.*, d.Name as DoctorName
//                  FROM MEDICAL_RECORD mr
//                  JOIN DOCTOR d ON mr.DoctorID = d.DoctorID
//                  WHERE mr.PatientID = ?
//                  ORDER BY mr.RecordDate DESC`,
//                 [patientId]
//             );

//             // Get treating doctors
//             const [doctors] = await conPool.promise().query(
//                 `SELECT d.*, dp.FirstConsultation
//                  FROM DOCTOR d
//                  JOIN DOCTOR_PATIENT dp ON d.DoctorID = dp.DoctorID
//                  WHERE dp.PatientID = ?`,
//                 [patientId]
//             );

//             return {
//                 activePrescriptions,
//                 medicalHistory,
//                 doctors
//             };
//         } catch (err) {
//             throw err;
//         }
//     }
// };

// module.exports = patientController;
