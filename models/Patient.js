// const { conPool } = require('../config/db');

// class Patient {
//     static async findById(id) {
//         try {
//             const [rows] = await conPool.promise().query(
//                 'SELECT * FROM user WHERE UserID = ? AND Role = "PATIENT"',
//                 [id]
//             );
//             return rows[0];
//         } catch (err) {
//             throw err;
//         }
//     }

//     static async getPrescriptions(patientId) {
//         try {
//             const [rows] = await conPool.promise().query(
//                 'SELECT * FROM prescriptions WHERE PatientID = ?',
//                 [patientId]
//             );
//             return rows;
//         } catch (err) {
//             throw err;
//         }
//     }
// }

// module.exports = Patient;
