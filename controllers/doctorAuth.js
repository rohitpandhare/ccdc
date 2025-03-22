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
    }
};

module.exports = doctorController;
