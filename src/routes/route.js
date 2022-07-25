const express = require('express');
const router = express.Router();
const {authentication} = require('../middlewares/auth')
const {createUser, userLogin,getUser, updateData} = require('../controllers/userController')

router.post('/register', createUser)
router.post('/login', userLogin)
router.get('/user/:userId/profile', authentication, getUser)
router.put('/user/:userId/profile', authentication, updateData)



router.all('/**', function(req,res){
    res.status(400).send({status:false, message:"Invalid params"})
})


module.exports = router;