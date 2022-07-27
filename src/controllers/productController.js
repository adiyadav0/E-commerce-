const productModel =require("../models/productModel");
const mongoose = require('mongoose');


const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidBody = function (data) {
    return Object.keys(data).length > 0;
};
/////////////////////////////////////////


const updateProductById = async function(req,res){
    try{
        let productId = req.params.productId;
        let data = req.body;
        
        let {title, description, price, productImage, style} = data

        if(!mongoose.isValidObjectId(productId)) return res.status(400).send({status:false, message:"Invalid product Id"})

        let checkPorduct= await productModel.findOne({_id: productId})
        if(!checkPorduct) return res.status(400).send({status:false, message:"This ProductId ${productId} dosen't exit"})

        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, msg: "please provide data in request body" })}

        if (title) {
        if (!/^[a-zA-Z0-9]/.test(title)) return res.status(400).send({ status: false, message: "Title should not be empty" });
        title = title.trim().split(" ").filter(word => word).join(" ")
        }
         
        if(description){
            if(!isValid(description))  {
                return res.status(400).send({status:false, message:"Description should not be empty"})
            }
            else{
                description = description.trim().split(" ").filter(word => word).join(" ")
            }
           
        }
        if(price){
            if(!isValid(price)) return res.status(400).send({status:false, message:"Price should not be empty"})
            price = price.trim().split(" ").filter(word => word).join(" ")
        }
        if(productImage){
            if(!isValid(productImage)) return res.status(400).send({status:false, message:"productImage should not be empty"})
        }
        if(style){
            if(!/^[a-zA-Z0-9]/.test(style)) return res.status(400).send({status:false, message:"style should be not empty"})
        }

         // check these key, value availabe in db or not

         let isTitleUnique = await productModel.findOne({ title: title });
         if (isTitleUnique) return res.status(400).send({ status: false, message: "title is already availalbe" });



         let updatedData = await productModel.findOneAndUpdate({ _id: productId, isDeleted:false },{$set:(data)}, { new: true });
         res.status(200).send({ status: true, message: 'Success', data: updatedData });
      }catch(error){
       return res.status(500).send({ status: false, message: error.message })
    
      }
}


module.exports = {updateProductById }