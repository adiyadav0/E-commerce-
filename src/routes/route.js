const express = require('express');
const router = express.Router();
const {createUser, userLogin, updateData} = require('../controllers/userController')

router.post('/register', createUser)
router.post('/login', userLogin)
router.put('/user/:userId/profile', updateData)

module.exports = router;