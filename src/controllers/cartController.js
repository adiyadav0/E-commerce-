const cartModel = require('../models/cartModel')
const userModel = require('../models/userModel');
const productModel= require('../models/productModel')
const mongoose= require('mongoose');


//.............................

const numberRegex = /^(?:0|[1-9]\d*)(?:\.(?!.*000)\d+)?$/

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

//.....................................Put API...................//

 const updateCart = async function( req, res){
    try{
        let userId = req.params.userId
        let updateData = req.body
        let {
            productId,
            cartId,
            removeProduct
        } = updateData

        if(!isValid(productId)){
            return res.status(400).send({status: false, message:"ProductId can not be empty"})
        }
        if(!mongoose.isValidObjectId(productId)){
            return res.status(400).send({status: false, message:"Invalid Product Id"})
        }
        
        if(!mongoose.isValidObjectId(cartId)){
            return res.status(400).send({status: false, message:"Invalid cart Id"})
        }
        let cart = await cartModel.findById(cartId)
            if(!cart){
                return res.status(400).send({status: false, message:"cart not found"})
         }

            if(cart.userId!= userId){
                return res.status(400).send({status: false, message:"this cart doesn't belong to this user"})
         }

         let product = await productModel.findOne({_id: productId, isDeleted: false})
            if(!product){
                return res.status(400).send({status: false, message:"product not found"})
         }


            if(!(removeProduct===0 || removeProduct === 1)){
                return res.status(400).send({status: false, message:"Please provide removeProduct as 1 to delete particular quantity of given product and 0 to delete the product itself"})
         }

            if(cart.totalPrice == 0 && cart.totalItems==0){
                return res.status(400).send({status: false, message:"Cart is empty"})
         }
            if(removeProduct==0) {
                for( let i=0; i<cart.items.length; i++) {
                    if(cart.items[i].productId==productId){
                    let quantityPrice = cart.items[i].quantity*product.price
                    let updatedPrice = cart.totalPrice-quantityPrice
                    cart.items.splice(i,1)
                    let updatedItems = cart.items.length

                    let updatedCart = await cartModel.findByIdAndUpdate({_id: cartId},{items: cart.items, totalPrice: updatedPrice, totalItems: updatedItems},
                        {returnDocument: "after"})
                        return res.status(200).send({status: true, message:"Updated successfully", data: updatedCart})   
                    
                }
                else{
                    return res.status(400).send({status: false, message:"cart does not have this product"})
                }
            }
         }
            if(removeProduct ==1){
                for( let i=0; i<cart.items.length; i++) {
                    if(cart.items[i].productId==productId){
                
                    if(cart.items[i].quantity ===1){
        
                    let updatedPrice = cart.totalPrice-(product.price)
                    cart.items.splice(i,1)
                    let updatedItems = cart.items.length

                    let updatedCart = await cartModel.findByIdAndUpdate({_id: cartId},{items: cart.items, totalPrice: updatedPrice, totalItems: updatedItems},
                        {returnDocument: "after"})
                    return res.status(200).send({status: true, message:"Updated successfully", data: updatedCart})  
                    }
                else{
                        cart.items[i].quantity -= 1
                        
                        let updatedPrice = cart.totalPrice-(product.price)
                        let updatedCart = await cartModel.findByIdAndUpdate({_id: cartId},{items: cart.items, totalPrice: updatedPrice},
                            {returnDocument: "after"})
                        return res.status(200).send({status: true, message:"Updated successfully", data: updatedCart})  

                    }
            }
            else{
                return res.status(400).send({status: false, message:"cart does not have this product"})
            }
          }
        }
       
        }catch(error){
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports={updateCart}