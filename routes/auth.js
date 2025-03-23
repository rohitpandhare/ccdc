const express = require('express');
const router = express.Router();

// User CRUD func import
const { 
    createUser, 
    doLogin, 
    getUserProfile, 
    updateUserProfile,
    reserPass,
    logout
} = require('../controllers/userAuth');

// Update route handlers to use the imported controller functions
router.get('/logout', logout);
router.get('/profile/:UserID', getUserProfile);

router.put('/profile/update', updateUserProfile);

router.post('/signup', createUser);
router.post('/login', doLogin);
router.post('/reset_pass', reserPass);


module.exports = router;
