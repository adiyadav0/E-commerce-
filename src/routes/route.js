const express = require('express');
const router = express.Router();
const {createUser, userLogin,getUser, updateData} = require('../controllers/userController')

router.post('/register', createUser)
router.post('/login', userLogin)
router.put('/user/:userId/profile', updateData)

router.get('/user/:userId/profile', getUser)

router.all('/**', function(req,res){
    res.status(400).send({status:false, message:"Invalid params"})
})

module.exports = router;