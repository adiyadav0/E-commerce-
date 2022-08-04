const mongoose = require('mongoose');
const cartModel = require('../models/cartModel');
const orderModel = require('../models/orderModel');
const userModel = require('../models/userModel');


/*############################################ Validations #######################################################*/

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidBody = function (data) {
    return Object.keys(data).length > 0;
};


/*############################################ Create Order #######################################################*/

const createOrder = async (req, res) => {
    try {
        let userId = req.params.userId
        let data = req.body
        let { cartId, cancellable, status } = data

        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, message: "Please provide cartId, Cancellable and Status" })
        }

        if (!isValid(cartId)) {
            return res.status(400).send({ status: false, message: "Please enter CartId" })
        }
        if (!mongoose.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "cartId is invalid!" })
        }

        const findCart = await cartModel.findOne({ _id: cartId, userId: userId })
        if (!findCart) {
            return res.status(404).send({ status: false, message: "No Cart found" })
        }

        let itemsArr = findCart.items
        if (itemsArr.length == 0) {
            return res.status(400).send({ status: false, message: "Cart is Empty" })
        }

        let sum = 0
        for (let i of itemsArr) {
            sum += i.quantity
        }

        let newData = {
            userId: userId,
            items: findCart.items,
            totalItems: findCart.totalItems,
            totalPrice: findCart.totalPrice,
            totalQuantity: sum,
        }

        if ("cancellable" in data) {
            if (typeof cancellable !="boolean") {
                return res.status(400).send({ status: false, message: "Please enter cancellable as true or false or remove the key for default" });
            }

            newData.cancellable = cancellable
        }

        if ("status" in data) {
            if (!isValid(status)) {
                return res.status(400).send({ status: false, message: "Please enter status" });
            }
            if (!["pending", "completed"].includes(status)) {
                return res.status(400).send({ status: false, message: "Status must be pending or completed while creating order or remove the key for default" });
            }
            newData.status = status
        }

        let createdOrder = await orderModel.create(newData)
        
        let output = await orderModel.findById({_id: createdOrder._id}).populate([{ path: "items.productId", select: { title: 1, productImage: 1, price: 1, isFreeShipping: 1 } }])

        await cartModel.findByIdAndUpdate(
            { _id: cartId },
            {
                items: [], 
                totalItems: 0,
                totalPrice: 0
            },
            { returnDocument: "after" })

        return res.status(201).send({ status: false, message: "Order Placed!!", data: output });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


/*############################################ Update Order #######################################################*/

const updateOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        const { orderId, status } = req.body

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: 'invalid userid!!' })
        }
        const user = await userModel.findOne({ _id: userId })
        if (!user) {
            return res.status(404).send({ status: false, message: 'user not found' })
        }
        if (!isValidBody(req.body)) {
            return res.status(400).send({ status: false, message: 'provide appropriate orderId in request body' })
        }
        if (!isValid(orderId)) {
            return res.status(400).send({ status: false, message: 'enter orderId' })
        }
        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, message: 'invalid orderId' })
        }
        let order = await orderModel.findOne({ _id: orderId, userId: userId, isDeleted: false })
        if (!order) {
            return res.status(404).send({ status: false, message: 'order not found' })
        }


            if (!isValid(status)) {
                return res.status(400).send({ status: false, message: "Please enter status" });
            }

            if (!["completed", "cancelled"].includes(status)) {
                return res.status(400).send({ status: false, message: "Status must be 'cancelled' or 'completed' while updating order" });
            }

            if(order.status == "cancelled" || order.status == "completed"){
                return res.status(400).send({ status: false, message: "Order is already 'cancelled' or 'completed' " });
            } 
        

        if (order.cancellable == true) {

            let filterData = {status : status }

            const updatedStatus = await orderModel.findByIdAndUpdate(
                { _id: orderId },
                filterData,
                { returnDocument: "after" }
           ).populate([{ path: "items.productId", select: { title: 1, productImage: 1, price: 1, isFreeShipping: 1 } }])
           
            return res.status(200).send({ status: true, message: "successfully updated the order status", data: updatedStatus })
        }
        else {
            return res.status(200).send({ status: true, message: "this order can not be cancelled" })
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = { createOrder, updateOrder }