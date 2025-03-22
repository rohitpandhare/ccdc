const { sendResponse } = require('./auth');
const { conPool } = require('../config/db');

const patientController = {
    getMyAppointments: async (req, res) => {
        const patientId = req.session.user.UserID;
        try {
            const [appointments] = await conPool.promise().query(
                'SELECT * FROM appointments WHERE PatientID = ?',
                [patientId]
            );
            sendResponse(res, "Appointments retrieved", appointments);
        } catch (err) {
            sendResponse(res, "Error fetching appointments", err.message, true, 500);
        }
    },
    getMyPrescriptions: async (req, res) => {
        const patientId = req.session.user.UserID;
        try {
            const [prescriptions] = await conPool.promise().query(
                'SELECT * FROM prescriptions WHERE PatientID = ?',
                [patientId]
            );
            res.json({ success: true, data: prescriptions });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    bookAppointment: async (req, res) => {
        const { doctorId, appointmentDate } = req.body;
        const patientId = req.session.user.UserID;
        try {
            const [result] = await conPool.promise().query(
                'INSERT INTO appointments (DoctorID, PatientID, AppointmentDate) VALUES (?, ?, ?)',
                [doctorId, patientId, appointmentDate]
            );
            res.json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
};

module.exports = patientController;
