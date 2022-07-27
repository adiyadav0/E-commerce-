const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            reuired: true,
            unique: true
        },
        description: {
            type: String,
            reuired: true
        },
        price: {
            type: Number,
            reuired: true           //  valid number/decimal
        },
        currencyId: {
            type: String,
            reuired: true //INR
        },
        currencyFormat: {
            type: String,
            reuired: true //Rupee symbol
        },
        isFreeShipping: {
            type: Boolean,
            default: false
        },
        productImage: {
            type: String,
            reuired: true    // s3 link
        },
        style: {
            type: String
        },
        availableSizes: {
            type: [String]      // at least one size, enum["S", "XS","M","X", "L","XXL", "XL"]},
        },
        installments: {
            type: Number
        },
        deletedAt: {
            type: Date            // when the document is deleted
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true })

module.exports = mongoose.model("product", productSchema)