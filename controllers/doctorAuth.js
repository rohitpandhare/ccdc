const conPool = require('../config/db');
const { sendResponse, generateReferenceId } = require('./auth');

// Task 1 - view patients under doc
async function getPatients(req, res) {
    try {
        const DoctorID = req.session.user.UserID;
        
        // Updated query to match exact schema
        const [patients] = await conPool.query(
            `SELECT 
                p.PatientID,
                p.Name, 
                p.Address, 
                p.Phone,
                p.DOB, 
                p.BloodGroup,
                p.MedicalHistory,
                dp.ConsultationType,
                dp.FirstConsultation,
                dp.TreatmentNotes
            FROM patient p 
            INNER JOIN doctor_patient dp ON p.PatientID = dp.PatientID 
            WHERE dp.DoctorID = ?`, 
            [DoctorID]
        );

        sendResponse(res, "Patients fetched successfully", patients);
    } catch (error) {
        console.error(error);
        sendResponse(res, "Error fetching patients", {}, true, 500);
    }
}

// Task 2 - create prescription
async function createPrescription(req, res) {
    try {
        const DoctorID = req.session.user.UserID;
        const { PatientID, Medicines, DiagnosisNotes } = req.body;

        // Set current date for DateIssued
        const DateIssued = new Date().toISOString().split('T')[0];
        
        // Set initial status as 'ACTIVE'
        const Status = 'ACTIVE';

        // Generate a unique prescription reference ID
        const GlobalReferenceID = generateReferenceId();

        // Validate that patient is assigned to the doctor
        const [patientCheck] = await conPool.query(
            'SELECT * FROM doctor_patient WHERE DoctorID = ? AND PatientID = ?', 
            [DoctorID, PatientID]
        );

        if (patientCheck.length === 0) {
            return sendResponse(res, "Patient not assigned to this doctor", {}, true, 400);
        }

        // Corrected INSERT query with proper VALUES clause and column list
        const [newPres] = await conPool.query(
            `INSERT INTO prescription 
            (PatientID, DoctorID, DateIssued, DiagnosisNotes, Medicines, Status, GlobalReferenceID)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                PatientID,
                DoctorID,
                DateIssued,
                DiagnosisNotes,
                JSON.stringify(Medicines),
                Status,
                GlobalReferenceID
            ]
        );

        sendResponse(res, "Prescription created successfully", {
            PrescriptionID: newPres.insertId,
            GlobalReferenceID,
            DateIssued,
            Status
        });
    } catch (error) {
        console.error(error);
        sendResponse(res, "Error creating prescription", {}, true, 500);
    }
}

module.exports = {
    getPatients,
    createPrescription
};
