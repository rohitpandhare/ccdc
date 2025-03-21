const express = require('express');
const router = express.Router();
const md5 = require('md5');

// Import the connection pool from db.js
const { conPool } = require('../config/db');

// Signup Route
router.post('/signup', (req, res) => {
    const {
        username,
        fname,
        lname,
        email,
        password,
        userType  // Default user type
    } = req.body;

    console.log('Signup Attempt:', {
        username,
        userType, // Normalize user type
        email
    });

    const hashedPassword = md5(password);

    const query = `
        INSERT INTO ccdc.users 
        (username, fname, lname, email, passkey, active, user_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        username,
        fname,
        lname,
        email,
        hashedPassword,
        1,
        userType // Ensure lowercase storage
    ];

    // Use promise-based query method for mysql2
    conPool.promise().query(query, values)
        .then(([result]) => {
            console.log('User Created Successfully:', {
                username,
                userType
            });
            res.redirect('/login');
        })
        .catch((err) => {
            console.error('Signup Error:', err);
            
            // Handle specific error scenarios
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).render('signup', {
                    error: 'Username or email already exists'
                });
            }

            return res.status(500).render('signup', {
                error: 'Registration failed: ' + err.message
            });
        });
});


// Login Route
router.post('/login', async (req, res) => {
    const { username, password, userType } = req.body;

    console.log('Login Attempt:', {
        username: username,
        attemptedUserType: userType // Log the attempted user type
    });

    // Hash the password
    const hashedPassword = md5(password);

    // Detailed query to check user credentials and type
    const query = `
        SELECT * FROM ccdc.users 
        WHERE username = ? AND passkey = ? AND user_type = ?
    `;

    try {
        // Use promise-based query
        const [results] = await conPool.promise().query(query, [username, hashedPassword, userType.toLowerCase()]);

        console.log('Query Results:', results);

        // Check if user exists
        if (results.length === 0) {
            return res.status(401).render('login', { 
                error: 'Invalid credentials or user type' 
            });
        }

        const user = results[0];

        // Explicit type checking
        console.log('Stored User Type:', user.user_type);
        console.log('Submitted User Type:', userType);

        // Compare user type (case-insensitive)
        if (user.user_type.toLowerCase() !== userType.toLowerCase()) {
            return res.status(401).send(`Invalid User Type. 
                Expected: ${user.user_type}, 
                Submitted: ${userType}`);
        }

        // Successful login
        req.session.loggedIn = true;
        req.session.user = user;

        // Role-based redirection
        switch(user.user_type) {
            case 'admin':
                return res.redirect('/admin');
            case 'doctor':
                return res.redirect('/doctor');
            case 'patient':
                return res.redirect('/patient');
            default:
                return res.redirect('/dashboard');
        }
    } catch (err) {
        console.error('Login Error:', err);
        return res.status(500).render('login', { 
            error: 'Server error. Please try again.' 
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

module.exports = router;
