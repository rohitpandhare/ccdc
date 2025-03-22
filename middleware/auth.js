const { sendResponse } = require('../controllers/auth');

const chkLogin = (req, res, next) => {
    if (req.session.loggedIn) {
        next();
    } else {
        return sendResponse(res, "Unauthorized: Please log in", {}, true, 401);
    }
};

module.exports = { chkLogin };
