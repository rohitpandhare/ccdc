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

module.exports = checkRole;