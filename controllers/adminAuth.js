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
        },
        getSystemStats: async() =>{
            try {
                // Get user statistics
                const [userStats] = await conPool.promise().query(
                    `SELECT Role, COUNT(*) as UserCount
                     FROM USER
                     GROUP BY Role`
                );
    
                // Get recent activities
                const [recentActivities] = await conPool.promise().query(
                    `SELECT aa.*, u.Username
                     FROM ADMIN_ACTIVITY aa
                     JOIN USER u ON aa.AdminUserID = u.UserID
                     ORDER BY aa.ActivityTimestamp DESC
                     LIMIT 10`
                );
    
                // Get system health metrics
                const [systemHealth] = await conPool.promise().query(
                    `SELECT 
                        (SELECT COUNT(*) FROM USER) as TotalUsers,
                        (SELECT COUNT(*) FROM PRESCRIPTION WHERE DateIssued = CURRENT_DATE) as TodayPrescriptions,
                        (SELECT COUNT(*) FROM MEDICAL_RECORD WHERE RecordDate = CURRENT_DATE) as TodayRecords`
                );
    
                return {
                    userStats,
                    recentActivities,
                    systemHealth: systemHealth[0]
                };
            } catch (err) {
                throw err;
            }
        }
};

module.exports = adminController;

