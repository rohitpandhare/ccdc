const { sendResponse } = require('../controllers/auth'); //use of helper func

const chkLogin = (req, res, next) => {
    if (req.session.loggedIn) {
        next(); //proceed on logged in
    } else {
        return sendResponse(res, "Unauthorized: Please log in", {}, true, 401);
         // err
    }
};

const checkRole = (roles = []) => {
    return (req, res, next) => {
      if (!req.session.loggedIn) {
        return res.redirect('/login');
      }
      
      if (!roles.includes(req.session.user.Role.toLowerCase())) {
        return res.status(403).render('checks/error', {
          message: 'Access Denied'
        });
      }
      
      next();
    };
  };

module.exports = { chkLogin, checkRole };
