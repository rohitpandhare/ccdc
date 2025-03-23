const conPool = require('../config/db');

const adminController = {
    getDashboard: async (req, res) => {
        try {
            const [adminDetails] = await conPool.promise().query(
                'SELECT Username FROM user WHERE UserID = ?',
                [req.session.user.UserID]
            );
            
            const [userList, doctorList, patientList] = await Promise.all([
                conPool.promise().query('SELECT * FROM user'),
                conPool.promise().query('SELECT * FROM doctor'),
                conPool.promise().query('SELECT * FROM patient')
            ]);
            
            res.render('users/admin', {
                user: adminDetails[0],
                userList: userList[0],
                doctorList: doctorList[0],
                patientList: patientList[0]
            });
        } catch (err) {
            res.status(500).render('error', { error: err });
        }
    },

    deleteUser: async (req, res) => {
        try {
            await conPool.promise().query(
                'DELETE FROM user WHERE UserID = ?', 
                [req.params.id]
            );
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false });
        }
    }
};

module.exports = adminController;
