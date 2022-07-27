const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const userModel = require('../models/userModel');



/*############################################ authentication ##########################################################*/

const authentication = async function (req, res, next) {
    try { 
        let token = req.header('Authorization');
        if (!token) {
            return res.status(400).send({ status: false, message: "login is required" })
        }

        let splitToken = token.split(" ")
        console.log(token)

        jwt.verify(splitToken[1], "doneBy50", (error) => {
            if (error) {
                const message =
                    error.message === "jwt expired" ? "Token is expired, Please login again" : "Token is invalid, Please recheck your Token"
                return res.status(401).send({ status: false, message })
            }
            next();
        })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

/*############################################ authorization ##########################################################*/

let authorization = async function (req, res, next) {
    try {
        let token = req.header('Authorization', 'Bearer Token');
        let splitToken = token.split(" ")
        let decodedtoken = jwt.verify(splitToken[1], "doneBy50")
        let userId = req.params.userId;
        if (!mongoose.isValidObjectId(userId))
            return res.status(400).send({ status: false, msg: "Please enter valid userId" })

        let user = await userModel.findOne({ _id: userId })
        if (!user) {
            return res.status(404).send({ status: false, msg: "User does not exist with this userId" })
        }
        if (decodedtoken.userId != user._id) {
            return res.status(403).send({ status: false, msg: "Unauthorised access" })
        }
        next()
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

module.exports = { authentication, authorization }