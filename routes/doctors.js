const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');

router.get('/appointments', checkAuth, async (req, res) => {
    // Add appointment handling logic
});
