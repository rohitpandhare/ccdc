const md5 = require('md5');
const { conPool } = require('../config/db');

function grabHeaders(headerdata) {
    return headerdata.map(h => h.name);
}

function sendResponse(res, message = "ok", data = {}, error = false, status = 200) {
    res.set('Access-Control-Allow-Credentials', true);
    try {
        res.status(status).json({
            message: message,
            data: data
        });
    } catch (error) {
        res.json({
            message: error.message,
            data: data
        });
    }
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

// Modified createUser function with better validation
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
    
    // Two-step transaction for user creation
    conPool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).render('signup', {
                error: "Database connection error"
            });
        }

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                return res.status(500).render('signup', {
                    error: "Transaction error"
                });
            }

            const query = `
                INSERT INTO user
                (Username, Email, Password, Role) 
                VALUES (?, ?, ?, ?)
            `;
            
            connection.query(query, [Username, Email, hashedPassword, normalizedUserType], (err, result) => {
                if (err) {
                    connection.rollback(() => {
                        connection.release();
                        if (err.code === 'ER_DUP_ENTRY') {
                            return res.status(400).render('signup', {
                                error: "Username or email already exists"
                            });
                        }
                        return res.status(500).render('signup', {
                            error: "Error creating user: " + err.message
                        });
                    });
                    return;
                }

                connection.commit(err => {
                    if (err) {
                        connection.rollback(() => {
                            connection.release();
                            return res.status(500).render('signup', {
                                error: "Error finalizing user creation"
                            });
                        });
                        return;
                    }
                    
                    connection.release();
                    res.redirect('/login');
                });
            });
        });
    });
}

// Modified doLogin function with better session handling
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
        req.session.lastActivity = Date.now();

        // Update last login timestamp
        conPool.query('UPDATE user SET LastLogin = CURRENT_TIMESTAMP WHERE UserID = ?', [user.UserID]);

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

// Keep original getUserProfile and updateUserProfile functions
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


// Add this to your existing auth.js
const checkAuth = (req, res, next) => {
    if (req.session && req.session.loggedIn) {
        next();
    } else {
        // Set as guest user
        req.session.role = 'GUEST';
        next();
    }
};

const isGuest = (req) => {
    return !req.session.loggedIn;
};


module.exports = {
    grabHeaders,
    sendResponse,
    getUserTypes,
    createUser,
    doLogin,
    getUserProfile,
    updateUserProfile,
    checkAuth,
    isGuest
};
