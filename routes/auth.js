const express = require('express');
const router = express.Router();
const md5 = require('md5');

// Import the connection pool from db.js
const { conPool } = require('../config/db');

const { 
    createUser, 
    doLogin, 
    getUserProfile, 
    updateUserProfile 
} = require('../controllers/auth');

// Update route handlers to use the imported controller functions
router.post('/signup', createUser);
router.post('/login', doLogin);
router.get('/profile/:UserID', getUserProfile);
router.put('/profile/update', updateUserProfile);

// Signup Route
router.post('/signup', async (req, res) => {
    const { Username, Email, Password, Role } = req.body;
    
    try {
        const hashedPassword = md5(Password);
        const [result] = await conPool.promise().query(
            'INSERT INTO user (Username, Email, Password, Role) VALUES (?, ?, ?, ?)',
            [Username, Email, hashedPassword, Role]
        );
        
        res.redirect('/login');
    } catch (err) {
        console.error('Signup Error:', err);
        res.status(400).render('signup', {
            error: err.code === 'ER_DUP_ENTRY' 
                ? 'Username or email already exists' 
                : 'Registration failed'
        });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { Username, Password, Role } = req.body;
    console.log('Login request body:', req.body);

    if (!Username || !Password || !Role) {
        return res.status(400).json({
            success: false,
            message: 'Please provide Username, Password and Role'
        });
    }

    try {
        const hashedPassword = md5(Password);
        const [users] = await conPool.promise().query(
            'SELECT * FROM user WHERE Username = ? AND Password = ? AND Role = ?',
            [Username, hashedPassword, Role]
        );
        
        if (users.length === 0) {
            return res.status(401).render('login', {
                error: 'Invalid credentials',
                attemptedData: {
                  username: req.body.Username || '',
                  role: req.body.Role || ''
                }
            });
        }
        
        const user = users[0];
        req.session.loggedIn = true;
        req.session.user = user;
        
        const roleRoutes = {
            admin: '/admin',
            doctor: '/doctor',
            patient: '/patient'
        };
        
        res.redirect(roleRoutes[user.Role.toLowerCase()] || '/dashboard');
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).render('login', {
            error: 'Server error occurred'
        });
    }
});

// Doctor Statistics Route
router.get('/doctor-stats', async (req, res) => {
    if (!req.session.user || req.session.user.Role !== 'doctor') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        // Get total patients count
        const [patientCount] = await conPool.promise().query(
            'SELECT COUNT(*) as count FROM user WHERE Role = "patient"'
        );

        // Get upcoming appointments
        const [appointmentCount] = await conPool.promise().query(
            'SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND appointment_date > NOW()',
            [req.session.user.UserID]
        );

        // Get recent appointments
        const [recentAppointments] = await conPool.promise().query(
            'SELECT * FROM appointments WHERE doctor_id = ? ORDER BY appointment_date DESC LIMIT 5',
            [req.session.user.UserID]
        );

        const stats = {
            totalPatients: patientCount[0].count || 0,
            upcomingAppointments: appointmentCount[0].count || 0,
            recentAppointments: recentAppointments || []
        };

        res.json({ success: true, stats });
    } catch (err) {
        console.error('Error fetching doctor statistics:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch statistics',
            stats: {
                totalPatients: 0,
                upcomingAppointments: 0,
                recentAppointments: []
            }
        });
    }
});

// Logout Route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to log out' });
        }
        res.redirect('/');
    });
});

// Reset Password Route
router.post('/reset_pass', async (req, res) => {
    const { Username, newPassword, confirmPassword } = req.body;
    
    try {
        const [users] = await conPool.promise().query(
            'SELECT * FROM user WHERE Username = ?',
            [Username]
        );

        if (users.length === 0) {
            return res.status(404).render('reset_pass', {
                error: 'Username not found'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).render('reset_pass', {
                error: 'Passwords do not match'
            });
        }

        const hashedPassword = md5(newPassword);

        await conPool.promise().query(
            'UPDATE user SET Password = ? WHERE Username = ?',
            [hashedPassword, Username]
        );

        res.redirect('/login');

    } catch (err) {
        console.error('Password Reset Error:', err);
        res.status(500).render('reset_pass', {
            error: 'Failed to reset password'
        });
    }
});

// Doctor Search Route
router.get('/doctors/search', (req, res) => {
    const { specialty } = req.query;
    const wantsJson = req.headers.accept && req.headers.accept.includes('application/json');
    
    if (!specialty) {
        return wantsJson 
            ? res.status(400).json({
                success: false,
                error: 'Specialty parameter is required'
              })
            : res.render('error', { 
                message: 'Specialty parameter is required' 
              });
    }

    const query = `
        SELECT Name, Specialty, Phone
        FROM DOCTOR 
        WHERE Specialty LIKE ?`;

    conPool.query(query, [`%${specialty}%`], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return wantsJson
                ? res.status(500).json({
                    success: false,
                    error: 'Database error'
                  })
                : res.render('error', { 
                    message: 'Database error' 
                  });
        }

        const defaultUser = {
            Username: 'Guest',
            Role: 'viewer'
        };

        const user = req.session.user || defaultUser;

        return wantsJson
            ? res.json({
                success: true,
                data: results
              })
            : res.render('doctor', { 
                doctors: results,
                user: user,
                stats: {
                    totalPatients: 42,
                    upcomingAppointments: 8,
                    prescriptions: 15
                },
                recentAppointments: [
                    {
                        patient: "John Doe",
                        date: "2024-03-20",
                        status: "Completed"
                    },
                    {
                        patient: "Jane Smith",
                        date: "2024-03-21",
                        status: "Pending"
                    }
                ]
              });
    });
});

// Test Routes
router.get('/test', (req, res) => {
    console.log('Test route hit');
    
    const query = 'SELECT 1 as test';
    
    conPool.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                error: 'Database connection failed'
            });
        }
        
        res.json({
            success: true,
            message: 'Test route working!',
            dbConnection: 'successful',
            timestamp: new Date()
        });
    });
});

router.get('/test/doctors', (req, res) => {
    const query = `
        SELECT COUNT(*) as doctorCount 
        FROM DOCTOR`;
    
    conPool.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: 'Failed to count doctors'
            });
        }
        
        res.json({
            success: true,
            message: 'Doctor count successful',
            count: results[0].doctorCount
        });
    });
});

router.get('/test/:param', (req, res) => {
    res.json({
        success: true,
        message: 'Parameter test route working!',
        parameter: req.params.param
    });
});

module.exports = router;
