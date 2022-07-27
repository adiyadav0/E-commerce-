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
            var availableSize = availableSizes.split(" ").filter(a=>a).join("").toUpperCase().split(",")
            if (availableSize.length === 0) {
                return res.status(400).send({ status: false, message: "Please provide product sizes" })
            }
            for (let i = 0; i < availableSize.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"]).includes(availableSize[i])) {
                    return res.status(400).send({ status: false, message: 'Sizes should be among ["S", "XS", "M", "X", "L", "XXL", "XL"]' })
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









module.exports = { createProduct }