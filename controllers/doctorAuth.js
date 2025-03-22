const { sendResponse } = require('./auth');
const { conPool } = require('../config/db');

const doctorController = {
    getPatientList: async (req, res) => {
        const doctorId = req.session.user.UserID;
        try {
            const [patients] = await conPool.promise().query(
                'SELECT DISTINCT p.* FROM user p JOIN appointments a ON p.UserID = a.PatientID WHERE a.DoctorID = ?',
                [doctorId]
            );
            sendResponse(res, "Patients retrieved", patients);
        } catch (err) {
            sendResponse(res, "Error fetching patients", err.message, true, 500);
        }
    },

    getDashboardStats: async(doctorId) =>{
        try {
            // Get patient count
            const [patientCount] = await conPool.promise().query(
                `SELECT COUNT(DISTINCT dp.PatientID) as count 
                 FROM DOCTOR_PATIENT dp 
                 WHERE dp.DoctorID = ?`,
                [doctorId]
            );

            // Get recent prescriptions
            const [recentPrescriptions] = await conPool.promise().query(
                `SELECT p.*, pat.Name as PatientName 
                 FROM PRESCRIPTION p
                 JOIN PATIENT pat ON p.PatientID = pat.PatientID
                 WHERE p.DoctorID = ?
                 ORDER BY p.DateIssued DESC LIMIT 5`,
                [doctorId]
            );

            // Get patient demographics
            const [demographics] = await conPool.promise().query(
                `SELECT 
                    CASE 
                        WHEN TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) < 18 THEN 'Under 18'
                        WHEN TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) BETWEEN 18 AND 30 THEN '18-30'
                        WHEN TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) BETWEEN 31 AND 50 THEN '31-50'
                        ELSE 'Over 50'
                    END as AgeGroup,
                    COUNT(*) as PatientCount
                FROM PATIENT p
                JOIN DOCTOR_PATIENT dp ON p.PatientID = dp.PatientID
                WHERE dp.DoctorID = ?
                GROUP BY AgeGroup`,
                [doctorId]
            );

            return {
                totalPatients: patientCount[0].count,
                recentPrescriptions,
                demographics
            };
        } catch (err) {
            throw err;
        }
    }
};

module.exports = doctorController;
