const express = require('express');
const router = express.Router();
const md5 = require('md5');

// Import the connection pool from db.js
const { conPool } = require('../config/db');

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
    // Validate input
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
                attemptedData: { // Helps identify mismatches
                  username: req.body.Username || '',
                  role: req.body.Role || ''
                }
              });
              
        }
        
        const user = users[0];
        req.session.loggedIn = true;
        req.session.user = user;
        
        // Redirect based on role
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

// Logout Route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to log out' });
        }
        res.redirect('/');
    });
});

router.post('/reset_pass', async (req, res) => {
    const { Username, newPassword, confirmPassword } = req.body;
    
    try {
        // Verify user exists
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

        //new password hashed
        const hashedPassword = md5(newPassword);

        // Update the password
        await conPool.promise().query(
            'UPDATE user SET Password = ? WHERE Username = ?',
            [hashedPassword, Username]
        );

        // Redirect to login with success message
        res.redirect('/login');

    } catch (err) {
        console.error('Password Reset Error:', err);
        res.status(500).render('reset_pass', {
            error: 'Failed to reset password'
        });
    }
});

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

        // Get the logged-in user's data
        const defaultUser = {
            Username: 'Guest',
            Role: 'viewer'
        };

        // Use session user if available, otherwise use default
        const user = req.session.user || defaultUser;

        return wantsJson
            ? res.json({
                success: true,
                data: results
              })
            : res.render('doctor', { 
                doctors: results,
                user: user,
                // Add these mock statistics
                stats: {
                    totalPatients: 42,
                    upcomingAppointments: 8,
                    prescriptions: 15
                },
                // Add mock recent appointments
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


//testing
// Add this route BEFORE your other routes in auth.js
router.get('/test', (req, res) => {
    console.log('Test route hit'); // Debug log
    
    // Execute a simple database query to test connection
    const query = 'SELECT 1 as test';
    
    conPool.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                error: 'Database connection failed'
            });
        }
        
        // Send success response
        res.json({
            success: true,
            message: 'Test route working!',
            dbConnection: 'successful',
            timestamp: new Date()
        });
    });
});

// Add a more comprehensive test route
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

// Test route with params
router.get('/test/:param', (req, res) => {
    res.json({
        success: true,
        message: 'Parameter test route working!',
        parameter: req.params.param
    });
});


module.exports = router;
