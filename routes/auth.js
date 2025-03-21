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


module.exports = router;
