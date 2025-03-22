const { conPool } = require('../config/db');

class Doctor {
    static async findById(id) {
        try {
            const [rows] = await conPool.promise().query(
                'SELECT * FROM user WHERE UserID = ? AND Role = "DOCTOR"',
                [id]
            );
            return rows[0];
        } catch (err) {
            throw err;
        }
    }

    static async getAppointments(doctorId) {
        try {
            const [rows] = await conPool.promise().query(
                'SELECT * FROM appointments WHERE DoctorID = ?',
                [doctorId]
            );
            return rows;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Doctor;
