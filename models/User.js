// const { conPool } = require('../config/db');

// class User {
//     static async findByUsername(username) {
//         try {
//             const [rows] = await conPool.promise().query(
//                 'SELECT * FROM user WHERE Username = ?',
//                 [username]
//             );
//             return rows[0];
//         } catch (err) {
//             throw err;
//         }
//     }

//     static async updateProfile(userId, data) {
//         try {
//             const [result] = await conPool.promise().query(
//                 'UPDATE user SET ? WHERE UserID = ?',
//                 [data, userId]
//             );
//             return result;
//         } catch (err) {
//             throw err;
//         }
//     }
// }

// module.exports = User;
