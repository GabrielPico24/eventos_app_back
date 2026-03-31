const express = require('express');
const { login } = require('../controllers/auth.Controller');

const router = express.Router();

router.post('/login', login);

module.exports = router;