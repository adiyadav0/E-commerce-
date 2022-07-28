const productModel = require('../models/productModel')
const upload = require('../.aws/config')
const mongoose = require('mongoose')


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


/*############################################ createProduct #################################################*/

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
            if (!installments.match(/^\d*\.?\d*$/)) {
                return res.status(400).send({ status: false, message: "Installment should be an integer" })
            }
        }

        let existingTitle = await productModel.findOne({ title: title }).lean();

        if (existingTitle) {
            return res.status(400).send({ status: false, message: "This Title already exist" });
        }

        productImage = await upload.uploadFile(files[0])

        const productData = {}

        productData.title = title.trim().split(' ').filter(a => a).join(' '),
            productData.description = description.trim().split(' ').filter(a => a).join(' '),
            productData.price = price,
            productData.currencyId = "INR",
            productData.currencyFormat = "₹",
            productData.productImage = productImage,
            productData.isFreeShipping = isFreeShipping,
            productData.style = style.trim(),
            productData.availableSizes = availableSize,
            productData.installments = installments,
            productData.deletedAt = null,
            productData.isDeleted = false

        const productCreated = await productModel.create(productData)

        res.status(201).send({ status: true, message: "Product Created Successfully", data: productCreated })
    } catch (err) {
        res.status(500).send({ status: false, error: err.message });
    }
}



const getproduct = async function (req, res) {
    try {
        let query = req.query;
        const { size, name, priceGreaterThan, priceLessThan } = query;

        let filter = { isDeleted: false }

        if (size) {
            let asize = size.split(",")
            console.log(asize)
            filter.availableSizes = asize[0]
        }
        if (name) {
            filter.name = query.name
        }

        if (priceGreaterThan) {
            if (isNaN(priceGreaterThan)) {
                return res.status(400).send({ status: false, message: 'Price should be a valid number' })
            }
            if (priceGreaterThan < 0) {
                return res.status(400).send({ status: false, message: 'Price can not be less than zero' })
            }

            filter.price = {}
            filter.price['$gt'] = priceGreaterThan
        }
        if (priceLessThan) {
            if (isNaN(priceLessThan)) {
                return res.status(400).send({ status: false, message: 'Price should be a valid number' })
            }
            if (priceLessThan <= 0) {
                return res.status(400).send({ status: false, message: 'Price can not be zero or less than zero' })
            }
            filter.price = {}
            filter.price['$lt'] = priceLessThan
        }
        if (priceSort) {
            if (!((priceSort == 1) || (priceSort == -1))) {
                return res.status(400).send({ status: false, message: 'priceSort should be 1 or -1 ' })
            }
            const products = await productModel.find(filter).sort({ price: priceSort })
            if (products.length === 0) {
                return res.status(404).send({ productStatus: false, message: 'No Product found' })
            }
            return res.status(200).send({ status: true, message: 'Success', data: products })
        }
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, msg: err.message })
    }
}




// const getproduct = async function(req,res){
//     try{
//     let data = req.query
//     let filter = { isDeleted: false}
//         let {size, name, priceGreaterThan , priceLessThan  } = data 
//         if(!isValidBody(data)){
//             let allproduct = await productModel.find(filter).sort({priceSort : 1})
//             if(allproduct.length==0) return res.status(400).send({status:false,msg:"there is no product right now"})
//             return res.status(200).send({status:false,items : allproduct})
//         }

//         if(isValid(size)){
//              let bySize = await productModel.find({availableSizes:size})
//              if(bySize.length==0){
//                 return res.status(400).send({status:false,msg:"there is no product with this size"})
//              }
//              filter["availableSizes"]=size
//         }

//         if(isValid(name)){
//             let byName = await productModel.find({title:name})
//             if(byName.length==0){
//                 return res.status(400).send({status:false,msg:"there is no product with this name"})
//             }
//             filter["title"]=name
//         }

//         if(isValidNumber(priceGreaterThan)){
//             let byGreater = await productModel.find({price:{$gte:priceGreaterThan}})
//             if(byGreater.length==0){
//                 return res.status(400).send({status:false,msg:"there is no product greater than this price"})
//             }
//             filter["price"]= {$gte:priceGreaterThan}
//         }

//         if(isValidNumber(priceLessThan)){
//             let byLesser = await productModel.find({price:{$lte:priceLessThan}})
//             if(byLesser.length==0){
//                 return res.status(400).send({status:false,msg:"there is no product Lesser than this price"})
//             }
//             filter["price"]= {$lte:priceLessThan}
//         }

//         let productByQuery = await productModel.find(filter).sort({priceSort : 1})
//         if(productByQuery.length==0){
//             return res.status(400).send({status:false,msg:"no product found with this filter"})
//         }
//         else{
//             return res.status(200).send({status:true,items:productByQuery})
//         }
// }catch(err){
//     return res.status(500).send({status:false,msg:err.message})
// }
// }




const getProductById = async function (req, res) {
    try {
        const productId = req.params.productId

        //validation for given productId
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "please enter valid productId" })
        }

        const productData = await productModel.findOne({ _id: productId, isdeleted: false })
        if (!productData) {
            return res.status(404).send({ status: false, message: "Product not found" })
        }
        return res.status(200).send({ status: true, message: "Product Detail", data: productData })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}





const updateProductById = async function (req, res) {
    try {
        let productId = req.params.productId;
        let data = req.body;
        let files = req.files

        let { title, description, price, style } = data

        if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid product Id" })

        let checkPorduct = await productModel.findOne({ _id: productId })
        if (!checkPorduct) return res.status(400).send({ status: false, message: "This ProductId ${productId} dosen't exit" })

        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, msg: "please provide data in request body" })
        }

        // if(title){
        //     if(!Object.values(title).length>0 || !(/^[a-zA-Z0-9]/.test(title))) {
        //         return res.status(400).send({status:false, message:"please provide title"})
        //     }
        //     title=data.title.trim().split(' ').filter(a=>a).join(' ')
        // }
        if (title) {
            if (!(title)) {
                return res.status(400).send({ status: false, message: "title is required" })
            }
        }

        if (description) {
            if (!(description)) {
                return res.status(400).send({ status: false, message: "Description should not be empty" })
            }
            else {
                description = description.trim().split(" ").filter(word => word).join(" ")
            }

        }
        if (price) {
            if (!isValid(price)) return res.status(400).send({ status: false, message: "Price should not be empty" })
            price = price.trim().split(" ").filter(word => word).join(" ")
        }
        if (files) {
            if (!isValid(files)) return res.status(400).send({ status: false, message: "productImage should not be empty" })
        }
        if (style) {
            if (!/^[a-zA-Z0-9]/.test(style)) return res.status(400).send({ status: false, message: "style should be not empty" }) 
        }

        // check these key, value availabe in db or not

        let isTitleUnique = await productModel.findOne({ title: title.trim() });
        console.log(isTitleUnique)
        if (isTitleUnique) return res.status(400).send({ status: false, message: "title is already available" });



        let updatedData = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { $set: (data) }, { new: true });
        res.status(200).send({ status: true, message: 'Success', data: updatedData });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })

    }
}






const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.productId

        //validation for given productId
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "please enter valid productId" })
        }

        let productData = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })
        if (!productData) {
            return res.status(404).send({ status: false, message: "Product is already deleted or does not exist" })
        }
        return res.status(200).send({ status: true, message: "Product deleted Successfully..." })
    }
    catch (error) {
        res.status(500).send({ status: false, messsage: error.message })
    }
}


module.exports = { createProduct, getproduct, getProductById, updateProductById, deleteProduct }
