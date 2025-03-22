const { sendResponse } = require('./auth');
const { conPool } = require('../config/db');

const adminController = {
    getDashboardStats: async (req, res) => {
        try {
            const [stats] = await conPool.promise().query(`
                SELECT 
                    (SELECT COUNT(*) FROM user WHERE Role = 'patient') as patientCount,
                    (SELECT COUNT(*) FROM user WHERE Role = 'doctor') as doctorCount
            `);
            sendResponse(res, "Stats retrieved", stats[0]);
        } catch (err) {
            sendResponse(res, "Error fetching stats", err.message, true, 500);
        }
    },
        // Get all users
        getAllUsers: async (req, res) => {
            try {
                const [users] = await conPool.promise().query('SELECT * FROM user');
                res.json({ success: true, data: users });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message });
            }
        },
    
        // Get system statistics
        getStats: async (req, res) => {
            try {
                const [stats] = await conPool.promise().query(`
                    SELECT 
                        (SELECT COUNT(*) FROM user WHERE Role = 'PATIENT') as patientCount,
                        (SELECT COUNT(*) FROM user WHERE Role = 'DOCTOR') as doctorCount
                `);
                res.json({ success: true, data: stats[0] });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message });
            }
        }
};

module.exports = adminController;
