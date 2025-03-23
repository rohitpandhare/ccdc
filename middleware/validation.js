// const validator = {
//     validateLogin: (req, res, next) => {
//         const { Username, Password, Role } = req.body;
//         if (!Username || !Password || !Role) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Missing required fields'
//             });
//         }
//         next();
//     },

//     validateRegistration: (req, res, next) => {
//         const { Username, Email, Password, Role } = req.body;
//         if (!Username || !Email || !Password || !Role) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Missing required fields'
//             });
//         }
//         // Basic email validation
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(Email)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid email format'
//             });
//         }
//         next();
//     }
// };

// module.exports = validator;
