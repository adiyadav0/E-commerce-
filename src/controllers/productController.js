const productModel = require('../models/productModel')
const upload = require('../.aws/config')
const mongoose = require('mongoose');



/*############################################ Validations ##########################################################*/

const priceRegex = /^(?:0|[1-9]\d*)(?:\.(?!.*000)\d+)?$/

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidBody = function (data) {
    return Object.keys(data).length > 0;
};




/*############################################ createProduct ##########################################################*/

const createProduct = async function (req, res) {
    try {
        let createData = req.body
        let files = req.files

        let {
            title,
            description,
            price,
            isFreeShipping,
            style,
            availableSizes,
            installments
        } = createData

        if (!isValidBody(createData)) {
            return res.status(400).send({ status: false, message: "Body is required" })
        }

        if (!isValid(title)) {
            return res.status(400).send({ status: false, message: "title is required" })
        }

        if (!isValid(description)) {
            return res.status(400).send({ status: false, message: "Description is required" })
        }
        if (!isValid(price)) {
            return res.status(400).send({ status: false, message: "price is required" })
        }

        if (!priceRegex.test(price)) {
            return res.status(400).send({ status: false, message: "plz enter a valid Price" });
        }
       
        if (isFreeShipping) {
            if (!isValid(isFreeShipping)) {
                return res.status(400).send({ status: false, message: "Please enter isfreeshipping or remove this section's key also" });
            }
            if (!['true', 'false'].includes(isFreeShipping)) {
                return res.status(400).send({ status: false, message: "isFreeshipping should be either True or False" });
            }
        }
       
        if (files && files.length > 0) {
            let check = files[0].mimetype.split("/")
            const extension = ["png", "jpg", "jpeg", "webp"]
            if (extension.indexOf(check[1]) == -1) {
                return res.status(400).send({ status: false, message: "Please provide image only" })
            }
        }
        else {
            return res.status(400).send({ msg: "No file found" })
        }


        if (!isValid(availableSizes)) {
            return res.status(400).send({ status: false, message: "Available sizes is required or at least provide one size" })
        }
        if (availableSizes) {
            var availableSize = availableSizes.toUpperCase().split(",") 
            if (availableSize.length === 0) {
                return res.status(400).send({ status: false, message: "Please provide product sizes" })
            }
            for (let i = 0; i < availableSize.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"]).includes(availableSize[i])) {
                    return res.status(400).send({ status: false, message: 'Sizes should be ${["S", "XS", "M", "X", "L", "XXL", "XL"]}' })
                }
            }
        }
        if (installments) {
             if (!installments.match(/^\d*\.?\d*$/)){
              return res.status(400).send({ status: false, message: "Installment should be an integer" }) 
            }
        }

        let existingTitle = await productModel.findOne({ title: title }).lean();

        if (existingTitle) {
            return res.status(400).send({ status: false, message: "This Title already exist" });
        }

        productImage = await upload.uploadFile(files[0])

        const productData = {}

        productData.title= title.trim().split(' ').filter(a=>a).join(' '),
        productData.description= description.trim().split(' ').filter(a=>a).join(' '),
        productData.price= price,
        productData.currencyId= "INR",
        productData.currencyFormat= "₹",
        productData.productImage= productImage,
        productData.isFreeShipping= isFreeShipping,
        productData.style= style.trim(),
        productData.availableSizes= availableSize,
        productData.installments = installments,
        productData.deletedAt = null, 
        productData.isDeleted = false

        const productCreated = await productModel.create(productData)
        
        res.status(201).send({ status: true, message: "Product Created Successfully", data: productCreated })
    } catch (err) {
        res.status(500).send({ status: false, error: err.message });
    }
}


//<----------------------------------------UPDATEAPI--------------------------->


const updateProductById = async function(req,res){
    try{
        let productId = req.params.productId;
        let data =req.body;
        let files = req.files

        let {title, description, price, style} = data

        if(!mongoose.isValidObjectId(productId)) return res.status(400).send({status:false, message:"Invalid product Id"})

        let checkPorduct= await productModel.findOne({_id: productId})
        if(!checkPorduct) return res.status(400).send({status:false, message:"This ProductId ${productId} dosen't exit"})

        if (!Object.keys(data).length && typeof files === 'undefined') {
            return res.status(400).send({ status: false, msg: "please provide data in request body" })
        }

       if(title == '') return res.status(400).send({status:false, message:"Title tag is required"})
        if(title){
            if(!isValid(title)) {
                return res.status(400).send({status:false, message:"please provide title"})
            }
         let isTitleUnique = await productModel.findOne({ title: title });
         if (isTitleUnique) return res.status(409).send({ status: false, message: "title is already availalbe" });
           // title=title.trim().split(' ').filter(a=>a).join(' ')   
        }
        if(description == '') return res.status(400).send({status:false, message:"description tag is required"})
        if(description){
            if(!isValid(description))  {
                return res.status(400).send({status:false, message:"Description should not be empty"})}
            else{
                description = description.trim().split(" ").filter(word => word).join(" ")}    
        }

        if(price == '') return res.status(400).send({status:false, message:"price tag is not be empty"})
        if(price){
            // if(!isValid(price)) return res.status(400).send({status:false, message:"Price should not be empty"})
            if(!priceRegex.test(price))  return res.status(400).send({ status: false, message: "price must be a number" });
            price = price.trim().split(" ").filter(word => word).join(" ")
        }
       
    
        if (files && files.length > 0) {
            let check = files[0].mimetype.split("/")
            const extension = ["png", "jpg", "jpeg", "webp"]
            if (extension.indexOf(check[1]) == -1) {
                return res.status(400).send({ status: false, message: "Please provide image only" })
            }
        }
     

        if(style == '') return res.status(400).send({status:false, message: "style tag not be empty"})
        if(style){
            if(!isValid(style)) return res.status(400).send({status:false, message:"style should be not empty"})
        }

        
         let updatedData = await productModel.findOneAndUpdate({_id: productId, isDeleted:false },{$set:data},{new:true });
         res.status(200).send({ status: true, message: 'Success', data: updatedData });
      }catch(error){
       return res.status(500).send({ status: false, message: error.message })
    
      }
}

module.exports = { createProduct,updateProductById }
