const userModel = require('../models/userModel')
const aws = require("aws-sdk")
const bcrypt = require('bcrypt');
const validator = require("email-validator");
const upload = require('../.aws/config')
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');


//--------------------------------------------------------------------------//

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidBody = function (data) {
    return Object.keys(data).length > 0;
};


let alphabetTestOfString = function (value) {
    let regex = /^[a-zA-Z\\s]{2,10}$/;
    if (regex.test(value)) {
        return true;
    }
    return false;
};

const isValidSyntaxOfEmail = function (value) {
    if (validator.validate(value.trim())) {
        return true;
    }
    return false;
};

const isValidMobileNum = function (value) {
    if (/^[6-9]\d{9}$/.test(value)) {
        return true;
    }
    return false;
};

const isValidPinCode = (value) => {
    const regEx = /^\s*([0-9]){6}\s*$/
    const result = regEx.test(value)
    return result
}
const isValidPassword = function (value) {
    const passwordregex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,15}$/
    if (passwordregex.test(value)) {
        return true;
    }
    return false;
};

const validateEmail = function (mail) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
        return true;
    }
}



/*############################################ createUser ##########################################################*/

const createUser = async function (req, res) {
    try {
        let data = req.body;

        const { fname, lname, email, phone, password, address } = data;

        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, msg: "please provide data in request body" })
        }
        if (!isValid(fname) && !alphabetTestOfString(fname)) {
            return res.status(400).send({ status: false, msg: "fname is invalid" })
        }
        if (!isValid(lname) && !alphabetTestOfString(lname)) {
            return res.status(400).send({ status: false, msg: "fname is invalid" })
        }
        if (!isValid(email) && !isValidSyntaxOfEmail(email)) {
            return res.status(400).send({ status: false, msg: "email is invalid" })
        }
        let userEmail = await userModel.find({ email: data.email })
        if (userEmail.length !== 0)
            return res.status(401).send({ status: false, msg: "This e-mail address is already exist , Please enter valid E-mail address" })

        if (!isValid(phone) && !isValidMobileNum(phone)) {
            return res.status(400).send({ status: false, msg: "phone is invalid" })
        }
        let userNumber = await userModel.find({ phone: data.phone })
        if (userNumber.length !== 0)
            return res.status(401).send({ status: false, msg: "This phone number is already exist , Please enter another phone number" })

        if (!isValidPassword(password)) {
            return res.status(400).send({ status: false, msg: "password should be strong please use One digit, one upper case , one lower case ,one special character, its b/w 8 to 15" })
        }

        const salt = await bcrypt.genSalt(10)
        data.password = await bcrypt.hash(data.password, salt)

        let parseAddress = JSON.parse(address)

        if (parseAddress) {

            if (parseAddress.shipping != undefined) {

                if (!isValid(parseAddress.shipping.street)) {
                     return res.status(400).send({ status: false, msg: "please provide street" }) 
                    }

                if (!isValid(parseAddress.shipping.city)) {
                     return res.status(400).send({ status: false, msg: "please provide city" }) 
                    }

                if (!isValid(parseAddress.shipping.pincode)) {
                     return res.status(400).send({ status: false, msg: "please provide pincode" }) 
                    }
            }
            else {
                 return res.status(400).send({ status: false, msg: "please provide shipping Address" }) 
                }

            if (parseAddress.billing != undefined) {

                if (!isValid(parseAddress.billing.street)) {
                     return res.status(400).send({ status: false, msg: "please provide street" }) 
                    }

                if (!isValid(parseAddress.billing.city)) {
                     return res.status(400).send({ status: false, msg: "please provide City" }) 
                    }

                if (!isValid(parseAddress.billing.pincode)) {
                     return res.status(400).send({ status: false, msg: "please provide Pincode" }) 
                    }

            }
            else {
                 return res.status(400).send({ status: false, msg: "please provide billing Address" }) 
                }
        }




        // if(!isValid(address.shipping.street)){
        //     return res.status(400).send({status:false,msg:"please provide street"})
        // }
        // if(!isValid(address.shipping.city)){
        //     return res.status(400).send({status:false,msg:"please provide city name"})
        // }
        // if(!isValidPinCode(address.shipping.pincode)){
        //     return res.status(400).send({status:false,msg:"please provide valid pincode"})
        // }
        // if(!isValid(address.billing.street)){
        //     return res.status(400).send({status:false,msg:"please provide street"})
        // }
        // if(!isValid(address.billing.city)){
        //     return res.status(400).send({status:false,msg:"please provide city name"})
        // }
        // if(!isValidPinCode(address.billing.pincode)){
        //     return res.status(400).send({status:false,msg:"please provide valid pincode"})
        // }

        let files = req.files
        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            let uploadedFileURL = await upload.uploadFile(files[0])
            // res.status(201).send({msg: "file uploaded succesfully", data: uploadedFileURL})
            data.profileImage = uploadedFileURL;
        }
        else {
            res.status(400).send({ msg: "No file found" })
        }

        const userData = {
            fname: fname,
            lname: lname,
            profileImage: data.profileImage,
            email: email,
            phone: phone,
            password: data.password,
            address: parseAddress
        }

        const document = await userModel.create(userData)
        res.status(201).send({ status: true, data: document })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }


}



/*############################################ userLogin ##########################################################*/

const userLogin = async function (req, res) {
    try {
        const data = req.body

        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, msg: "Please Enter Login Credentials..." })
        }

        const { email, password } = data

        if (!isValid(email)) {
            return res.status(400).send({ status: false, msg: "Please enter Email Id" })
        }

        if (!validateEmail(email)) {
            return res.status(400).send({ status: false, message: "Email is not valid" })

        }

        if (!isValid(password)) {
            return res.status(400).send({ status: false, msg: "Please enter Password" })
        }
        if (!isValidPassword(password)) {
            return res.status(400).send({ status: false, msg: "Password Should be 8-15 Characters." })
        }

        const user = await userModel.findOne({ email: email })

        if (user) {
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(400).send({ status: false, msg: "Invalid Password" });
            }
        } else {
            return res.status(401).send({ status: false, msg: "Invalid Credentials" });
        }

        const token = jwt.sign({
            userId: user._id.toString(),
            project: "doneBy50",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 1 * 60 * 60
        }, "doneBy50")

        res.setHeader("Authorization", token)
        const output = {
            userId: user._id,
            token: token
        }

        return res.status(201).send({ status: true, msg: "User login successfull", data: output })

    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}


/*############################################ getUser ##########################################################*/

const getUser = async function(req,res){
    try{
    let userId = req.params.userId
    if(!mongoose.isValidObjectId(userId)){
        return res.status(400).send({status:false,message:"userId is invalid"});
      }  
    let userData= await userModel.findById(userId)
    if(!userData){
        return res.status(404).send({status:false, message:"No user found"})
    }
    return res.status(200).send({status:true,message:"User profile details",data:userData})

}catch(error){
    res.status(500).send({status:false,message: error.message})
}
}


/*############################################ updateData ##########################################################*/

let NameRegex = /^(?![\. ])[a-zA-Z\. ]+(?<! )$/
let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
let passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,15}$/
let addressStreetRegex = /[^a-zA-Z0-9]/
let addressCityRegex = /^[a-zA-Z]+$/
let pincodeRegex = /^[1-9]\d{5}$/
let phoneRegex = /^[6-9]\d{9}$/

const updateData = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        let files = req.files

        
        let { fname, lname, email, phone, password, address } = data
        //-----------------------------VALIDATING USERID-----------------------------------------------------//
        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "Invalid UserId ..." })
        
        let checkUser = await userModel.findOne({ _id: userId })
        if (!checkUser) return res.status(404).send({ status: false, message: `This UserId: ${userId} doesn't exist` })
               
        if (!isValidBody(data) && !isValid(files)) {
            return res.status(400).send({ status: false, msg: "please provide data in request body" })
        }

        if (files && files.length != 0) {
            let uploadedFileURL = await upload.uploadFile(files[0])
            checkUser.profileImage = uploadedFileURL
        }  

        if (fname) {
            if (!isValid(fname) || !NameRegex.test(fname)) {
                return res.status(400).send({ status: false, message: "first name is not Valid" })
            }
            checkUser.fname = fname
        }

        if (lname) {
            if (!isValid(lname) || !NameRegex.test(lname)) {
                return res.status(400).send({ status: false, msg: "last name is not Valid" })
            } checkUser.lname = lname
            }

        if (email) {
            if (!isValid(email) || !emailRegex.test(email)) {
                return res.status(400).send({ status: false, msg: "email is not Valid" })
            }
            let uniqueEmail = await userModel.findOne({ email: email })
            if (uniqueEmail) {
                return res.status(409).send({ status: false, msg: "This email already exists, Please try another one." })
            } checkUser.email = email
            }


        if (phone) {
            if (!isValid(phone) || !phoneRegex.test(phone)) {
                return res.status(400).send({ status: false, msg: "Phone no is not Valid" })
            }
            let uniquePhone = await userModel.findOne({ phone: phone })
            if (uniquePhone) {
                return res.status(409).send({ status: false, message: "This phone number already exists, Please try another one." })
            } checkUser.phone = phone
        }

        //--------------------------------UPDATING BCRYPTED PASSWORD------------------------------------------//
        if (password) {
            if (passwordRegex.test(password)) { 
                let saltRounds = await bcrypt.genSalt(10)
                password = await bcrypt.hash(password, saltRounds)
            }
            else {
                return res.status(400).send({ status: false, message: "password should be strong please use One digit, one upper case , one lower case ,one special character, its b/w 8 to 15" })
            }
            checkUser.password = password
        }

        //------------------------------ADDRESS VALIDATION FOR UPDATING---------------------------------------//
        if (address) {
            if (Object.keys(address).length == 0) return res.status(400).send({ status: false, message: "Please enter address and it should be in object!!" })
            // address = JSON.parse(address) 
            if (address.shipping) {
                if (address.shipping.street) {
                    if (!addressStreetRegex.test(address.shipping.street)) {
                        return res.status(400).send({ status: false, message: "Invalid Shipping street" })
                    } checkUser.address.shipping.street = address.shipping.street
                }

                if (address.shipping.city) {
                    if (!addressCityRegex.test(address.shipping.city)) {
                        return res.status(400).send({ status: false, message: "Invalid Shipping city" })
                    } checkUser.address.shipping.city = address.shipping.city
                }

                if (address.shipping.pincode) {
                    if (!pincodeRegex.test(address.shipping.pincode)) {
                        return res.status(400).send({ status: false, message: "Invalid Shipping pincode" })
                    } checkUser.address.shipping.pincode = address.shipping.pincode
                }
            }

            if (address.billing) {
                if (address.billing.street) {
                    if (!addressStreetRegex.test(address.billing.street)) {
                        return res.status(400).send({ status: false, message: "Invalid billing street" })
                    } checkUser.address.billing.street = address.billing.street
                }

                if (address.billing.city) {
                    if (!addressCityRegex.test(address.billing.city)) {
                        return res.status(400).send({ status: false, message: "Invalid billing city" })
                    } checkUser.address.billing.city = address.billing.city
                }

                if (address.billing.pincode) { 
                    if (!pincodeRegex.test(address.billing.pincode)) {
                        return res.status(400).send({ status: false, message: "Invalid Billing pincode" })
                    } checkUser.address.billing.pincode = address.billing.pincode
                }
            }
        }
        await checkUser.save()
        return res.status(200).send({ status: true, message: "User profile details", data: checkUser })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message })
    }
}




module.exports = { createUser, userLogin, updateData, getUser }
