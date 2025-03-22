const md5 = require('md5');
const { conPool } = require('../config/db');

function grabHeaders(headerdata) {
    return headerdata.map(h => h.name);
}

function sendResponse(res, message = "ok", data = {}, error = false, status = 200) {
    res.set('Access-Control-Allow-Credentials', true);
    try {
        res.status(status)
        res.json(
            {
                message: message,
                data: data
            }
        );
    } catch (error) {
        res.json({
            message: error.message,
            data: data
        });
    };
}

function getUserTypes(req, res) {
    conPool.query("SELECT UserID, Username, Role FROM user", (err, data, headerData) => {
        if (err) {
            console.error(err);
            sendResponse(res, "SQL Error", { message: err.message }, true, 500);
            return;
        }
        sendResponse(res, "ok", {
            heads: grabHeaders(headerData),
            data: data
        });
    });
}

function createUser(req, res) {
    const { Username, Email, Password, Role } = req.body;

    if (!Username || !Email || !Password || !Role) {
        return res.status(400).render('signup', {
            error: "Missing required fields"
        });
    }

    const validUserTypes = ['patient', 'doctor', 'admin'];
    const normalizedUserType = Role.toLowerCase();

    if (!validUserTypes.includes(normalizedUserType)) {
        return res.status(400).render('signup', {
            error: `Invalid user type. Must be one of: ${validUserTypes.join(', ')}`
        });
    }

    const hashedPassword = md5(Password);
    const query = `
        INSERT INTO user
        (Username, Email, Password, Role) 
        VALUES (?, ?, ?, ?)
    `;
    const values = [
        Username,
        Email,
        hashedPassword,
        normalizedUserType
    ];

    conPool.query(query, values, (err, result) => {
        if (err) {
            console.error('User Creation Error:', err);

            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).render('signup', {
                    error: "Username or email already exists"
                });
            }

            return res.status(500).render('signup', {
                error: "Error creating user: " + err.message
            });
        }

        console.log('User Created Successfully:', {
            username: Username,
            userType: normalizedUserType
        });

        res.redirect('/login?error=invalid_credentials');
    });
}

function doLogin(req, res) {
    const { Username, Password, Role } = req.body;
    const hashedPassword = md5(Password);

    const query = 'SELECT UserID, Email, Role FROM user WHERE Username = ? AND Password = ? AND Role = ?';

    conPool.query(query, [Username, hashedPassword, Role], (err, results) => {
        if (err) {
            return res.status(500).render('login', {
                error: "Database error occurred"
            });
        }

        if (results.length === 0) {
            return res.status(401).render('login', {
                error: "Invalid credentials"
            });
        }

        const user = results[0];
        req.session.loggedIn = true;
        req.session.user = user;

        switch (user.Role.toLowerCase()) {
            case 'admin':
                res.redirect('/admin');
                break;
            case 'doctor':
                res.redirect('/doctor');
                break;
            case 'patient':
                res.redirect('/patient');
                break;
            default:
                res.redirect('/dashboard');
        }
    });
}

function getUserProfile(req, res) {
    const userId = req.params.UserID;

    const query = 'SELECT UserID, Username, Email FROM users WHERE UserID = ?';

    conPool.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return sendResponse(res, "Error fetching user profile", { message: err.message }, true, 500);
        }

        if (results.length > 0) {
            sendResponse(res, "User profile retrieved", { user: results[0] });
        } else {
            sendResponse(res, "User not found", {}, true, 404);
        }
    });
}

function updateUserProfile(req, res) {
    const { UserID, Username, Email } = req.body;

    const query = 'UPDATE user SET Username = ?, Email = ? WHERE UserID = ?';

    conPool.query(query, [Username, Email, UserID], (err, result) => {
        if (err) {
            console.error(err);
            return sendResponse(res, "Error updating profile", { message: err.message }, true, 500);
        }

        if (result.affectedRows > 0) {
            sendResponse(res, "Profile updated successfully");
        } else {
            sendResponse(res, "User not found", {}, true, 404);
        }
    });
}

module.exports = {
    grabHeaders,
    sendResponse,
    getUserTypes,
    createUser,
    doLogin,
    getUserProfile,
    updateUserProfile
};
