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

        if ("size" in query) {
            if (Object.keys(size).length === 0) {
                return res.status(400).send({ status: false, message: 'Size query is empty, either provide query value or deselect it.' })
            }
            let asize = size.toUpperCase().split(",")     
            console.log(asize) 
            filter.availableSizes = asize[0]
        } 
        if ("name" in query) {       
            if (Object.keys(name).length === 0) {
                return res.status(400).send({ status: false, message: 'Name query is empty, either provide query value or deselect it.' })
            }
        filter.title= {$regex:name, $options:"i"}
        }

        if ("priceGreaterThan" in query) {
            if (Object.keys(priceGreaterThan).length === 0) {
                return res.status(400).send({ status: false, message: 'priceGreaterThan query is empty, either provide query value or deselect it.' })
            }
            if (isNaN(priceGreaterThan)) {
                return res.status(400).send({ status: false, message: 'Price should be a valid number' })
            }
            if (priceGreaterThan < 0) {
                return res.status(400).send({ status: false, message: 'Price can not be less than zero' })
            }

            filter.price = {}
            filter.price['$gt'] = priceGreaterThan
        }


        if ("priceLessThan" in query) {
            if (Object.keys(priceLessThan).length === 0) {
                return res.status(400).send({ status: false, message: 'priceLessThan query is empty, either provide query value or deselect it.' })
            }
            if (isNaN(priceLessThan)) {
                return res.status(400).send({ status: false, message: 'Price should be a valid number' })
            }
            if (priceLessThan <= 0) {
                return res.status(400).send({ status: false, message: 'Price can not be zero or less than zero' })
            }
            filter.price = {}
            filter.price['$lt'] = priceLessThan
        }

        if("priceLessThan" in query && "priceGreaterThan" in query){    
            // filter.price= {price:{$gt:priceGreaterThan,$lt:priceLessThan}}
            if(priceLessThan==priceGreaterThan){
                // const price = priceLessThan
                // filter.price={}
                // filter.price['$eq']=priceLessThan
                return res.status(400).send({ status: false, message: 'No product found with this price' })
            }
            if(priceLessThan>priceGreaterThan){
           const filterPrice=await productModel.find({filter,price:{$gt:priceGreaterThan,$lt:priceLessThan}})
           return res.status(400).send({ status: true, message: 'product found with this price', data:filterPrice})
            }
            // if(priceLessThan<priceGreaterThan){
            //    const filterPrice =await productModel.find({filter,price:{$nin:{$gt:priceGreaterThan,$lt:priceLessThan}}})
            //    return res.status(400).send({ status: true, message: 'product found with this price', data:filterPrice})
            // }
            
        }

        let priceSort=query.priceSort
        if ("priceSort" in query) {
            if (Object.keys(priceSort).length === 0) {
                return res.status(400).send({ status: false, message: 'priceSort query is empty, either provide query value or deselect it.' })
            }
            if (priceSort != 1 && priceSort != -1) {   
                return res.status(400).send({ status: false, message: 'priceSort should be 1 or -1 ' })
            }

            const products = await productModel.find(filter).sort({ price: priceSort })
            console.log(products)
            if (products.length === 0) {
                return res.status(404).send({ productStatus: false, message: 'No Product found' })
            }
            return res.status(200).send({ status: true, message: 'Sorted Data', data: products })
        }
        const products = await productModel.find(filter)
        if (products.length === 0) {
            return res.status(404).send({ productStatus: false, message: 'No Product found with matching query' })
        }
        return res.status(200).send({ status: true, message: 'Success', data: products })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, msg: err.message })
    }
}





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


module.exports = { createProduct, getproduct, getProductById, deleteProduct }
