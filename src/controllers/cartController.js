const mongoose = require('mongoose')
const cartModel = require('../models/cartModel')
const productModel = require('../models/productModel')


/*############################################ Validations #####################################################*/

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidBody = function (data) {
    return Object.keys(data).length > 0;
};


/*########################################## 10. create Cart ####################################################*/

const createCart = async function (req, res) {
    try {
        const data = req.body
        const userId = req.params.userId
        let { productId, quantity, cartId } = data

        //----------------------------- Validating body -----------------------------//
        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, message: ' Post Body is empty, Please add some key-value pairs' })
        }

        //first store all the keys of data in k and then compare with the valid field stored in another veriable named b
        let k = Object.keys(data)
        let b = ['productId', 'quantity', 'cartId']

        //if keys of provided data do not matches with the element in b then it will return the response here only 
        if (!(k.every(r => b.includes(r)))) {
            return res.status(400).send({ status: false, message: "Please provide valid key name " })
        }

        //----------------------------- Validating productId -----------------------------//
        if (!isValid(productId)) {
            return res.status(400).send({ status: false, message: ' ProductId must be required!' })
        }
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: ' ProductId must be a valid ObjectId !' })
        }

        //----------------------------- Validating quantity -----------------------------//
        if (quantity === 0) {
            return res.status(400).send({ status: false, message: ' Quantity can not be 0 !' })
        }
        quantity = quantity || 1
        if (isNaN(quantity) || (quantity < 1)) {
            return res.status(400).send({ status: false, message: ' Quantity must be in Number and greater than 0 !' })
        }

        //----------------------------- Checking if ProductId is available or not -----------------------------//
        const product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(404).send({ status: false, message: " productId not found!" })
        }
        var productData = {
            productId: product._id,
            title: product.title,
            productImage: product.productImage,
            price: product.price,
            isFreeShipping: product.isFreeShipping
        }

        //----------------------------- check if the cart is already exist or not -----------------------------//
        const cart = await cartModel.findOne({ userId }).populate([{ path: "items.productId", select: { title: 1, productImage: 1, price: 1, isFreeShipping: 1 } }])
        if (cart) {
            if ("cartId" in data) {
                if (!mongoose.isValidObjectId(cartId)) {
                    return res.status(400).send({ status: false, message: " Invalid cartId !" })
                }
                // check both cartid's from req.body and db cart are match or not?
                if (cart._id != cartId) {
                    return res.status(400).send({ status: false, message: " CartId doesn't belong to this user!" })
                }
            }

            // we neeed to check if the item already exist in my item's list or NOT!!
            let index = -1;
            for (let i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId._id == productId) {
                    index = i
                    break
                }
            }
            // now we need to add item
            if (index >= 0) {
                cart.items[index].quantity = cart.items[index].quantity + quantity
            }
            else {
                cart.items.push({ productId, quantity }) //push the another item added and will be added in total item
            }

            cart.totalPrice = cart.totalPrice + (product.price * quantity)
            cart.totalItems = cart.items.length
            await cart.save()
            const addedcart = await cartModel.findOne({ userId }).populate([{ path: "items.productId", select: { title: 1, productImage: 1, price: 1, isFreeShipping: 1 } }])

            return res.status(200).send({ status: true, message: " Item added successfully and Cart updated!", data: addedcart })
        }

        //----------------------------- Creating cart here -----------------------------//     
        const object = {
            userId,
            items: [{ productId, quantity }],
            totalPrice: product.price * quantity,
            totalItems: 1
        }
        await cartModel.create(object)

        const output = {
            userId,
            items: [{ productData, quantity }],
            totalPrice: product.price * quantity,
            totalItems: 1
        }
        return res.status(201).send({ status: true, message: ' New cart created and Item added successfully!', data: output })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}




/*########################################## 11. Update Cart ####################################################*/

const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let updateData = req.body
        let { productId, cartId, removeProduct } = updateData

        //----------------------------- Validating body -----------------------------//
        if (!isValidBody(updateData)) {
            return res.status(400).send({ status: false, message: ' Post Body is empty, Please add some key-value pairs' })
        }

        //----------------------------- Validating ProductId -----------------------------//
        if (!isValid(productId)) {
            return res.status(400).send({ status: false, message: "ProductId can not be empty" })
        }
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid Product Id" })
        }

        //----------------------------- Checking if card available in db -----------------------------//
        let cart = await cartModel.findOne({ userId, "items.productId": productId })
        if (!cart) {
            return res.status(404).send({ status: false, message: "cart not found with given product id" })
        }

        //----------------------------- Validating CartId if given in req. body -----------------------------//
        if ("cartId" in updateData) {
            if (!mongoose.isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: " Invalid cartId !" })
            }
            // check both cartid's from req.body and db cart are match or not?
            if (cart._id != cartId) {
                return res.status(400).send({ status: false, message: " CartId doesn't belong to this user!" })
            }
        }

        //----------------------------- Checking if Product available in db -----------------------------//
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(404).send({ status: false, message: "product not found" })
        }

        if (!(removeProduct === 0 || removeProduct === 1)) {
            return res.status(400).send({ status: false, message: "Please provide removeProduct as 1 to delete particular quantity of given product or 0 to delete the product itself" })
        }

        if (cart.totalPrice == 0 && cart.totalItems == 0) {
            return res.status(400).send({ status: false, message: "Cart is empty" })
        }

        //----------------------------- For removing Product from Cart -----------------------------//        
        if (removeProduct == 0) {
            for (var i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId == productId) {
                    let quantityPrice = cart.items[i].quantity * product.price
                    let updatedPrice = cart.totalPrice - quantityPrice
                    cart.items.splice(i, 1)
                    let updatedItems = cart.items.length

                    let updatedCart = await cartModel.findOneAndUpdate(
                        { userId },
                        { items: cart.items, totalPrice: updatedPrice, totalItems: updatedItems },
                        { returnDocument: "after" }
                    ).populate([{ path: "items.productId", select: { title: 1, productImage: 1, price: 1, isFreeShipping: 1 } }])

                    return res.status(200).send({ status: true, message: "Updated successfully", data: updatedCart })
                }
            }
        }

        //----------------------------- For reducing 1 quantity of Product from Cart -----------------------------//
        if (removeProduct == 1) {
            for (let i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId == productId) {

                    //if product's quantity is already 1 then reducing 1 quantity means remove product from cart
                    if (cart.items[i].quantity === 1) {

                        let updatedPrice = cart.totalPrice - (product.price)
                        cart.items.splice(i, 1)
                        let updatedItems = cart.items.length

                        let updatedCart = await cartModel.findOneAndUpdate(
                            { userId },
                            { items: cart.items, totalPrice: updatedPrice, totalItems: updatedItems },
                            { returnDocument: "after" }
                        ).populate([{ path: "items.productId", select: { title: 1, productImage: 1, price: 1, isFreeShipping: 1 } }])

                        return res.status(200).send({ status: true, message: "Updated successfully", data: updatedCart })
                    }
                    else {
                        cart.items[i].quantity -= 1

                        let updatedPrice = cart.totalPrice - (product.price)
                        let updatedCart = await cartModel.findOneAndUpdate(
                            { userId },
                            { items: cart.items, totalPrice: updatedPrice },
                            { returnDocument: "after" }
                        ).populate([{ path: "items.productId", select: { title: 1, productImage: 1, price: 1, isFreeShipping: 1 } }])

                        return res.status(200).send({ status: true, message: "Updated successfully", data: updatedCart })
                    }
                }
            }
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




/*########################################## 12. Get Cart ####################################################*/

const getCart = async function (req, res) {
    try {
        let userId = req.params.userId

        //----------------------------- Getting cart Detail -----------------------------//
        const cart = await cartModel.findOne({ userId: userId }).populate([{ path: "items.productId", select: { title: 1, productImage: 1, price: 1, isFreeShipping: 1 } }])
        if (!cart) {
            return res.status(404).send({ status: false, message: "cart not found" })
        }
        res.status(200).send({ status: true, message: "Find your cart details below: ", data: cart });
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}




/*########################################## 13. Delete Cart ####################################################*/

const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId

        //----------------------------- Deleting cart  -----------------------------//
        const cart = await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalItems: 0, totalPrice: 0 }, { new: true })

        if (!cart) {
            return res.status(404).send({ status: false, message: "cart not found" })
        }
        return res.status(204).send({ status: true, message: "deleted successfully", data: cart })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



module.exports = { createCart, updateCart, getCart, deleteCart }