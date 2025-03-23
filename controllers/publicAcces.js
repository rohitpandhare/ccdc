// const { conPool } = require('../config/db');
// const { sendResponse } = require('./auth');

// const publicController = {
//     // View Public Doctor Directory
//     getDoctorDirectory: async (req, res) => {
//         try {
//             const [doctors] = await conPool.promise().query(`
//                 SELECT 
//                     d.Name, 
//                     d.Specialty, 
//                     COUNT(dp.PatientID) as PatientCount
//                 FROM DOCTOR d
//                 LEFT JOIN DOCTOR_PATIENT dp ON d.DoctorID = dp.DoctorID
//                 GROUP BY d.DoctorID, d.Name, d.Specialty
//             `);
            
//             sendResponse(res, "Doctor directory retrieved", { doctors });
//         } catch (err) {
//             sendResponse(res, "Error fetching doctors", { message: err.message }, true, 500);
//         }
//     },

//     // Search Doctors
//     searchDoctors: async (req, res) => {
//         const { specialty } = req.query;
//         try {
//             const [doctors] = await conPool.promise().query(`
//                 SELECT Name, Specialty, Phone
//                 FROM DOCTOR 
//                 WHERE Specialty LIKE CONCAT('%', ?, '%')
//             `, [specialty]);
            
//             sendResponse(res, "Search results", { doctors });
//         } catch (err) {
//             sendResponse(res, "Error searching doctors", { message: err.message }, true, 500);
//         }
//     },

//     // View Public Prescription by Reference ID
//     getPublicPrescription: async (req, res) => {
//         const { globalRefId } = req.params;
//         try {
//             const [prescription] = await conPool.promise().query(`
//                 SELECT 
//                     p.PrescriptionID, 
//                     p.DateIssued, 
//                     p.DiagnosisNotes, 
//                     p.Medicines,
//                     d.Name as DoctorName, 
//                     pat.Name as PatientName
//                 FROM PRESCRIPTION p
//                 JOIN DOCTOR d ON p.DoctorID = d.DoctorID
//                 JOIN PATIENT pat ON p.PatientID = pat.PatientID
//                 WHERE p.GlobalReferenceID = ?
//             `, [globalRefId]);

//             if (prescription.length === 0) {
//                 return sendResponse(res, "Prescription not found", {}, true, 404);
//             }

//             sendResponse(res, "Prescription found", prescription[0]);
//         } catch (err) {
//             sendResponse(res, "Error fetching prescription", { message: err.message }, true, 500);
//         }
//     },

//     // Get Top Rated Doctors
//     getTopDoctors: async (req, res) => {
//         try {
//             const [doctors] = await conPool.promise().query(`
//                 SELECT 
//                     d.Name, 
//                     d.Specialty, 
//                     AVG(r.Rating) as AverageRating
//                 FROM DOCTOR d
//                 JOIN RATINGS r ON d.DoctorID = r.DoctorID
//                 GROUP BY d.DoctorID
//                 ORDER BY AverageRating DESC
//                 LIMIT 5
//             `);
            
//             sendResponse(res, "Top doctors retrieved", { doctors });
//         } catch (err) {
//             sendResponse(res, "Error fetching top doctors", { message: err.message }, true, 500);
//         }
//     }
// };

// module.exports = publicController;
