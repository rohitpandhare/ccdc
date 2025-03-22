const express = require('express');
const router = express.Router();
const conPool = require('../config/db');

// Public Doctor Directory
router.get('/doctors/directory', (req, res) => {
    const query = `
        SELECT d.Name, d.Specialty, COUNT(dp.PatientID) as PatientCount
        FROM DOCTOR d
        LEFT JOIN DOCTOR_PATIENT dp ON d.DoctorID = dp.DoctorID
        GROUP BY d.DoctorID, d.Name, d.Specialty`;

    conPool.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
        res.json({
            success: true,
            data: results
        });
    });
});

// Public Search Doctors
router.get('/doctors/search', (req, res) => {
    const { specialty } = req.query;
    const query = `
        SELECT Name, Specialty, Phone
        FROM DOCTOR 
        WHERE Specialty LIKE CONCAT('%', ?, '%')`;

    conPool.query(query, [specialty], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
        res.json({
            success: true,
            data: results
        });
    });
});

// Public View Prescription by Reference ID
router.get('/prescription/:globalRefId', (req, res) => {
    const { globalRefId } = req.params;
    const query = `
        SELECT p.PrescriptionID, p.DateIssued, p.DiagnosisNotes, 
               p.Medicines, d.Name as DoctorName, pat.Name as PatientName
        FROM PRESCRIPTION p
        JOIN DOCTOR d ON p.DoctorID = d.DoctorID
        JOIN PATIENT pat ON p.PatientID = pat.PatientID
        WHERE p.GlobalReferenceID = ?`;

    conPool.query(query, [globalRefId], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Prescription not found'
            });
        }
        res.json({
            success: true,
            data: results[0]
        });
    });
});

// Regular User Login
router.post('/login', (req, res) => {
    const { Username, Password } = req.body;
    const query = `
        SELECT UserID, Username, Role 
        FROM USER 
        WHERE Username = ? AND Password = ?`;
    
    conPool.query(query, [Username, Password], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        res.json({
            success: true,
            data: results[0]
        });
    });
});

module.exports = router;
