const express = require('express');
const router = express.Router();
const { authentication, authorization } = require('../middlewares/auth')
const { createUser, userLogin, getUser, updateUser } = require('../controllers/userController')
const { createProduct, getproduct, getProductById, updateProductById, deleteProduct } = require('../controllers/productController');
const { createCart, updateCart, getCart, deleteCart } = require('../controllers/cartController');
const { createOrder, updateOrder } = require("../controllers/orderController")


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

router.post('/users/:userId/cart', authentication, authorization, createCart)
router.put('/users/:userId/cart', authentication, authorization, updateCart)
router.get('/users/:userId/cart', authentication, authorization, getCart)
router.delete('/users/:userId/cart', authentication, authorization, deleteCart)

//----------------------------- Order's API -----------------------------//

router.post('/users/:userId/orders', authentication, authorization, createOrder)
router.put('/users/:userId/orders', authentication, authorization, updateOrder)


//----------------------------- For invalid end URL -----------------------------//

router.all('/**', function (req, res) {
    return res.status(400).send({ status: false, message: "Invalid http request" })
})


module.exports = router; 