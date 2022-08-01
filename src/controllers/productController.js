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
            return res.status(400).send({ message: "No file found" })
        }


        if (!isValid(availableSizes)) {
            return res.status(400).send({ status: false, message: "Available sizes is required or at least provide one size" })
        }
        if (availableSizes) {
            var availableSize = availableSizes.split(",").map(x => x.trim().toUpperCase()) 
            if (availableSize.length === 0) {
                return res.status(400).send({ status: false, message: "Please provide product sizes" })
            }
            for (let i = 0; i < availableSize.length; i++) {
                let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
                if (!(arr).includes(availableSize[i])) {
                    return res.status(400).send({ status: false, message: `availableSizes should be among [${arr}]` })
                }
            }
        }
        if (installments) {
            if (!installments.match(/^\d*\.?\d*$/)) {
                return res.status(400).send({ status: false, message: "Installment should be an integer" })
            }
        }

        let existingTitle = await productModel.findOne({ title: title.trim().split(' ').filter(a => a).join(' ') }).lean();

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




/*############################################ getproduct #################################################*/

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
            filter.availableSizes = asize[0]
        }
        if ("name" in query) {
            if (Object.keys(name).length === 0) {
                return res.status(400).send({ status: false, message: 'Name query is empty, either provide query value or deselect it.' })
            }
            filter.title = { $regex: name, $options: "i" }     // $regex is used to filter the matching substrings, $options for upper and lower case both at once
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
            filter.price = {$gt: priceGreaterThan}
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
            filter.price = {$lt: priceLessThan}
        }

        if ("priceLessThan" in query && "priceGreaterThan" in query) {
            if (priceLessThan == priceGreaterThan) {
                return res.status(400).send({ status: false, message: 'Please provide valid query for price' })
            }
            if (priceLessThan > priceGreaterThan) {
                filter.price = {$gt: priceGreaterThan, $lt: priceLessThan} 
            }
            if (priceLessThan < priceGreaterThan) {
                return res.status(400).send({ status: false, message: 'Invalid filter for Price Range' })
            }
        }

        let priceSort = query.priceSort
        if ("priceSort" in query) {
            if (Object.keys(priceSort).length === 0) {
                return res.status(400).send({ status: false, message: 'priceSort query is empty, either provide query value or deselect it.' })
            }
            if (priceSort != 1 && priceSort != -1) {
                return res.status(400).send({ status: false, message: 'priceSort should be 1 or -1 ' })
            }

            const products = await productModel.find(filter).sort({ price: priceSort })
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
        return res.status(500).send({ status: false, msg: err.message })
    }
}



/*############################################ getProductById #################################################*/

const getProductById = async function (req, res) {
    try {
        const productId = req.params.productId

        //validation for given productId
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "please enter valid productId" })
        }

        const productData = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productData) {
            return res.status(404).send({ status: false, message: "Product not found" })
        }
        return res.status(200).send({ status: true, message: "Product Detail", data: productData })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



/*############################################ updateProductById #################################################*/

const updateProductById = async function (req, res) {
    try {
        let productId = req.params.productId
        let data = req.body
        let files = req.files
        const updatedata = {};

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: " productId is  Invalid" })
        }

        const productFind = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productFind) {
            return res.status(404).send({ status: false, message: "No product found with this productId" })
        }

        if (!Object.keys(data).length && typeof files === 'undefined') {
            return res.status(400).send({ status: false, message: " Provide some data as input" })
        }

        let {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments
        } = data

        if ("title" in data) {
            if (!isValid(title)) {
                return res.status(400).send({ status: false, message: "Title is required" })
            }
            let titleCheck = await productModel.findOne({ title: title.trim().split(' ').filter(a => a).join(' ') })
            if (titleCheck) {
                return res.status(400).send({ status: false, message: 'Title already exists' })
            }
            updatedata.title = title.trim().split(' ').filter(a => a).join(' ')
        } 

        if ("description" in data) {
            if (!isValid(description)) {
                return res.status(400).send({ status: false, message: "description is required" })
            }
            updatedata.description = description.trim().split(' ').filter(a => a).join(' ')
        }

        if ("price" in data) {
            if (!isValid(price)) {
                return res.status(400).send({ status: false, message: "price is required" })
            }
            if (!priceRegex.test(price)) {
                return res.status(400).send({ status: false, message: "Please enter a valid Price" })
            }
            updatedata.price = price
        }

        if ("currencyId" in data) {
            if (!isValid(currencyId)) {
                return res.status(400).send({ status: false, message: "currencyId is required" })
            }
            if (currencyId !== 'INR') {
                return res.status(400).send({ status: false, message: "CurrencyId Should be in INR" })
            }
            updatedata.currencyId = currencyId.trim()
        }

        if ("currencyFormat" in data) {
            if (!isValid(currencyFormat)) {
                return res.status(400).send({ status: false, message: "currencyFormat is required" })
            }
            if (currencyFormat !== '₹') {
                return res.status(400).send({ status: false, message: "Currency Format Should be in ₹" })
            }
            updatedata.currencyFormat = currencyFormat.trim()
        }

        if ("style" in data) {
            if (!isValid(style)) {
                return res.status(400).send({ status: false, message: "style is required" })
            }
            updatedata.style = style.trim().split(' ').filter(a => a).join(' ')
        }

        if ("installments" in data) {
            if (!isValid(installments)) {
                return res.status(400).send({ status: false, message: "Installments is required" })
            }
            if (!(/^[0-9]*$/.test(installments))) {
                return res.status(400).send({ status: false, message: "Installment must be in Number" })
            }
            updatedata.installments = installments
        }



        if (files && files.length > 0) {
            let check = files[0].originalname.split(".")

            const extension = ["png", "jpg", "jpeg", "webp"]
            if (extension.indexOf(check[check.length - 1]) == -1) {
                return res.status(400).send({ status: false, message: "Please provide image only" })
            }
            var uploadedFileURL = await upload.uploadFile(files[0])
            updatedata.productImage = uploadedFileURL
        }

        if ("availableSizes" in data) {
            if (!isValid(availableSizes)) {
                return res.status(400).send({ status: false, message: "availableSizes is required" })
            }
            let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            var sizeArr = availableSizes.split(",").map(x => x.trim().toUpperCase())

            for (let i = 0; i < sizeArr.length; i++) {
                if (!(arr.includes(sizeArr[i]))) {
                    return res.status(400).send({ status: false, message: `availableSizes should be among [${arr}]` })
                }
            }
            let updatedSize = productFind.availableSizes
            updatedSize.push(...sizeArr)
            newSize = [...new Set(updatedSize)]
            updatedata.availableSizes = newSize
        }

        if ("isFreeShipping" in data) {
            if (!isValid(isFreeShipping)) {
                return res.status(400).send({ status: false, message: "isFreeShipping is required" })
            }

            if (!((isFreeShipping === "true") || (isFreeShipping === "false"))) {
                return res.status(400).send({ status: false, message: "isFreeShipping should be either True or False" })
            }
            updatedata.isFreeShipping = isFreeShipping
        }

        let updateProduct = await productModel.findOneAndUpdate(
            { _id: productId },
            updatedata,
            { returnDocument: "after" }
        )
        return res.status(200).send({ status: true, message: "Product updated successfully !!", data: updateProduct })
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, error: error.message })
    }
}



/*############################################ deleteProduct #################################################*/

const deleteProduct = async function (req, res) {
    try {
        const productId = req.params.productId

        //validation for given productId
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "please enter valid productId" })
        }

        let productData = await productModel.updateOne({ _id: productId, isDeleted: false }, { $set: { isDeleted: true, deletedAt: new Date() } }, { returnDocument: "after" })
        if (productData.modifiedCount == 0) {
            return res.status(404).send({ status: false, message: "Product is already deleted or does not exist" })
        }
        return res.status(200).send({ status: true, message: "Product deleted Successfully..." })
    }
    catch (error) {
        res.status(500).send({ status: false, messsage: error.message })
    }
}



module.exports = { createProduct, updateProductById, getproduct, getProductById, deleteProduct }
