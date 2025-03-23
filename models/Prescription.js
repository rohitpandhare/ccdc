// const { conPool } = require('../config/db');

// class Prescription {
//     static async create(data) {
//         try {
//             const [result] = await conPool.promise().query(
//                 'INSERT INTO prescriptions (DoctorID, PatientID, Medications, Instructions, CreatedAt) VALUES (?, ?, ?, ?, NOW())',
//                 [data.doctorId, data.patientId, data.medications, data.instructions]
//             );
//             return result;
//         } catch (err) {
//             throw err;
//         }
//     }

//     static async findById(id) {
//         try {
//             const [rows] = await conPool.promise().query(
//                 'SELECT * FROM prescriptions WHERE PrescriptionID = ?',
//                 [id]
//             );
//             return rows[0];
//         } catch (err) {
//             throw err;
//         }
//     }
// }

// module.exports = Prescription;
