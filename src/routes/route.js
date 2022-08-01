const express = require('express');
const router = express.Router();
const {authentication, authorization} = require('../middlewares/auth')
const {createUser, userLogin, getUser, updateUser} = require('../controllers/userController')
const {createProduct, getproduct, getProductById, updateProductById, deleteProduct} = require('../controllers/productController');
const { createCart, getCart } = require('../controllers/cartController');


//----------------------------- User's API -----------------------------//
router.post('/register', createUser)
router.post('/login', userLogin)
router.get('/user/:userId/profile', authentication, authorization, getUser)
router.put('/user/:userId/profile', authentication, authorization, updateUser)


//----------------------------- Product's API -----------------------------//
router.post('/products', createProduct)
router.get('/products', getproduct)
router.get('/products/:productId', getProductById)
router.put('/products/:productId', updateProductById)
router.delete('/products/:productId', deleteProduct)


//----------------------------- Cart's API -----------------------------//
router.post('/users/:userId/cart', createCart)
router.get('/users/:userId/cart', authentication, authorization, getCart)



router.all('/*', function (req, res) {
    res.status(400).send({ status: false, message: "Invalid params" })
})


module.exports = router; 