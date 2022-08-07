const mongoose = require('mongoose');
const cartModel = require('../models/cartModel');
const orderModel = require('../models/orderModel')


/*############################################ Validations #####################################################*/

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidBody = function (data) {
    return Object.keys(data).length > 0;
};


/*############################################ 14. Create Order ##################################################*/

const createOrder = async (req, res) => {
    try {
        let userId = req.params.userId
        let data = req.body
        let { cartId, cancellable, status } = data

        //----------------------------- Validating body -----------------------------//
        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, message: "Please provide 'cartId', 'cancellable' and 'status' " })
        }

        //first store all the keys of data in k and then compare with the valid field stored in another veriable named b
        let k = Object.keys(data)
        let b = ['cartId', 'cancellable', 'status']

        //if keys of provided data do not matches with the element in b then it will return the response here only 
        if (!(k.every(r => b.includes(r)))) {
            return res.status(400).send({ status: false, message: "Please provide valid key name " })
        }

        //----------------------------- Validating cartId -----------------------------//
        if (!isValid(cartId)) {
            return res.status(400).send({ status: false, message: "Please enter CartId" })
        }
        if (!mongoose.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "cartId is invalid!" })
        }

        //----------------------------- finding cart in db -----------------------------//
        const findCart = await cartModel.findOne({ _id: cartId, userId: userId })
        if (!findCart) {
            return res.status(404).send({ status: false, message: "No Cart found" })
        }

        //----------------------------- checking items in cart -----------------------------//
        let itemsArr = findCart.items
        if (itemsArr.length == 0) {
            return res.status(400).send({ status: false, message: "Cart is Empty" })
        }

        //----------------------------- Loop for finding total quantity -----------------------------//
        let sum = 0
        for (let i = 0; i < itemsArr.length; i++) {
            sum = sum + itemsArr[i].quantity
        }

        let newData = {
            userId: userId,
            items: findCart.items,
            totalItems: findCart.totalItems,
            totalPrice: findCart.totalPrice,
            totalQuantity: sum
        }

        //----------------------------- validating cancellable -----------------------------//
        if ("cancellable" in data) {
            if (typeof cancellable != "boolean") {
                return res.status(400).send({ status: false, message: "Please enter cancellable as 'true' or 'false' or remove the key for default" });
            }
            newData.cancellable = cancellable
        }

        //----------------------------- validating status -----------------------------//
        if ("status" in data) {
            if (!isValid(status)) {
                return res.status(400).send({ status: false, message: "Please enter status" });
            }
            if (!["pending", "completed"].includes(status)) {
                return res.status(400).send({ status: false, message: "Status must be 'pending' or 'completed' while creating order or remove the key for default" });
            }
            newData.status = status
        }

        //----------------------------- creating order -----------------------------//
        let createdOrder = await orderModel.create(newData)

        let output = await orderModel.findById({ _id: createdOrder._id }).populate([{ path: "items.productId", select: { title: 1, productImage: 1, price: 1, isFreeShipping: 1 } }])

        // After order being placed, cart should become empty
        await cartModel.findByIdAndUpdate(
            { _id: cartId },
            { items: [], totalItems: 0, totalPrice: 0 },
            { returnDocument: "after" })

        return res.status(201).send({ status: true, message: "Order Placed!!", data: output });
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}




/*############################################ 15. Update Order #################################################*/

const updateOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        const { orderId, status } = req.body

        //----------------------------- Validating body -----------------------------//
        if (!isValidBody(req.body)) {
            return res.status(400).send({ status: false, message: 'provide appropriate orderId in request body' })
        }

        //first store all the keys of data in k and then compare with the valid field stored in another veriable named b
        let k = Object.keys(req.body)
        let b = ['orderId', 'status']

        //if keys of provided data do not matches with the element in b then it will return the response here only 
        if (!(k.every(r => b.includes(r)))) {
            return res.status(400).send({ status: false, message: "Please provide valid key name " })
        }

        //----------------------------- Validating orderId -----------------------------//
        if (!isValid(orderId)) {
            return res.status(400).send({ status: false, message: 'enter orderId' })
        }
        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, message: 'orderId must be a valid objectId' })
        }

        //----------------------------- checking if order present in db -----------------------------//
        let order = await orderModel.findOne({ _id: orderId, userId: userId, isDeleted: false })
        if (!order) {
            return res.status(404).send({ status: false, message: 'order not found' })
        }

        //----------------------------- Validating order status -----------------------------//
        if (order.status == "cancelled" || order.status == "completed") {
            return res.status(400).send({ status: false, message: "Order is already 'completed' or 'cancelled' " });
        }

        if (!isValid(status)) {
            return res.status(400).send({ status: false, message: "Please enter status" });
        }

        if (!["completed", "cancelled"].includes(status)) {
            return res.status(400).send({ status: false, message: "Status must be 'cancelled' or 'completed' while updating order" });
        }

        //----------------------------- Updating order status -----------------------------//
        if (status == "cancelled") {
            // make sure only cancellable oreder is being cancelled 
            if (order.cancellable == true) {
                const updatedOrder = await orderModel.findByIdAndUpdate(
                    { _id: orderId },
                    { status: status },
                    { returnDocument: "after" }
                ).populate([{ path: "items.productId", select: { title: 1, productImage: 1, price: 1, isFreeShipping: 1 } }])

                return res.status(200).send({ status: true, message: "Order cancelled sucessfully", data: updatedOrder })
            } else {
                return res.status(400).send({ status: false, message: "This order can't be cancelled" })
            }
        }

        if (status == "completed") {
            const updatedOrder = await orderModel.findByIdAndUpdate(
                { _id: orderId },
                { status: status },
                { returnDocument: "after" }
            ).populate([{ path: "items.productId", select: { title: 1, productImage: 1, price: 1, isFreeShipping: 1 } }])

            return res.status(200).send({ status: true, message: "Order compeletd sucessfully", data: updatedOrder })
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



module.exports = { createOrder, updateOrder }