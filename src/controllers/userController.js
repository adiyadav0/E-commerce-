const userModel = require('../models/userModel')
const bcrypt = require('bcrypt');
const upload = require('../.aws/config')
const jwt = require('jsonwebtoken');


/*############################################ Validations #######################################################*/

let NameRegex = /^[a-zA-Z\.]+$/
let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
let passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,15}$/
let addressStreetRegex = /^\d*[a-zA-Z\d\s,.]*$/
let addressCityRegex = /^[a-zA-Z\s.]+$/
let pincodeRegex = /^[1-9][0-9]{5}$/
let phoneRegex = /^[6-9]\d{9}$/

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidBody = function (data) {
    return Object.keys(data).length > 0;
};


/*############################################ 1. Create User ###################################################*/

const createUser = async function (req, res) {
    try {
        let data = req.body;
        let files = req.files;
        const { fname, lname, email, phone, password, address } = data;

        //----------------------------- Validating body -----------------------------//
        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, message: "please provide data in request body" })
        }

        //first store all the keys of data in k and then compare with the valid fields stored in another veriable named b
        let k = Object.keys(data)
        let b = ['fname', 'lname', 'email', 'phone', 'password', 'address']

        //if keys of provided data do not matches with the element in b then it will return the response here only 
        if (!(k.every(r => b.includes(r)))) {
            return res.status(400).send({ status: false, message: "Please provide valid field name as 'fname, lname, email, phone, password, address, profileImage' only" })
        }

        //if key of provided file do not matches with 'profileImage' then it will return the response here only 
        if (!(files[0].fieldname === "profileImage")) {
            return res.status(400).send({ status: false, message: "Please provide valid field name as 'profileImage' only" })
        }

        //----------------------------- Validating fname -----------------------------//
        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: "fname is required" })
        }
        if (!NameRegex.test(fname.trim())) {
            return res.status(400).send({ status: false, message: "fname is invalid" })
        }

        //----------------------------- Validating lname -----------------------------//
        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: "lname is required" })
        }
        if (!NameRegex.test(lname.trim())) {
            return res.status(400).send({ status: false, message: "lname is invalid" })
        }

        //----------------------------- Validating email -----------------------------//
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "email is required" })
        }
        if (!emailRegex.test(email.trim())) {
            return res.status(400).send({ status: false, message: "email is invalid" })
        }

        //----------------------------- Validating Profile Image -----------------------------//
        if (files && files.length > 0) {
            let check = files[0].originalname.split(".")
            const extension = ["png", "jpg", "jpeg", "webp"]
            if (extension.indexOf(check[check.length - 1]) == -1) {
                return res.status(400).send({ status: false, message: "Please provide image only" })
            }
        }
        else {
            return res.status(400).send({ status: false, message: "Please Provide profile image, It is mandatory" })
        }

        //----------------------------- Validating phone -----------------------------//
        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "phone is required" })
        }
        if (!phoneRegex.test(phone.trim())) {
            return res.status(400).send({ status: false, message: "phone is invalid" })
        }

        //----------------------------- Validating password -----------------------------//
        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "password is required" })
        }
        if (!passwordRegex.test(password.trim())) {
            return res.status(400).send({ status: false, message: "password should be strong please use One digit, one upper case , one lower case ,one special character, it between 8 to 15" })
        }
        //-----------Bcrypting Password -----------//
        const salt = await bcrypt.genSalt(10)
        data.password = await bcrypt.hash(data.password, salt)

        //----------------------------- Validating Address -----------------------------//
        if (address) {
            try {
                var parseAddress = JSON.parse(address)
            }
            catch (error) {
                return res.status(400).send({ status: false, message: "Pincode should not start from 0 or Address should be in Object form" })
            }

            //----------------------------- Validating Shipping Address -----------------------------//
            if (parseAddress.shipping != undefined) {
                if (!isValid(parseAddress.shipping.street)) {
                    return res.status(400).send({ status: false, message: "please provide street for shipping address" })
                }
                if (!addressStreetRegex.test(parseAddress.shipping.street.trim())) {
                    return res.status(400).send({ status: false, message: "please provide valid street for shipping address" })
                }

                if (!isValid(parseAddress.shipping.city)) {
                    return res.status(400).send({ status: false, message: "please provide city for shipping address" })
                }
                if (!addressCityRegex.test(parseAddress.shipping.city.trim())) {
                    return res.status(400).send({ status: false, message: "please provide valid city for shipping address" })
                }

                if ((parseAddress.shipping.pincode == undefined || null)) {
                    return res.status(400).send({ status: false, message: "please provide pincode for shipping address" })
                }
                if (!pincodeRegex.test(parseAddress.shipping.pincode)) {
                    return res.status(400).send({ status: false, message: "please provide valid pincode for shipping address" })
                }
            }
            else {
                return res.status(400).send({ status: false, message: "please provide shipping Address" })
            }

            //----------------------------- Validating Billing Address -----------------------------//
            if (parseAddress.billing != undefined) {
                if (!isValid(parseAddress.billing.street)) {
                    return res.status(400).send({ status: false, message: "please provide street for billing address" })
                }
                if (!addressStreetRegex.test(parseAddress.billing.street.trim())) {
                    return res.status(400).send({ status: false, message: "please provide valid street for billing address" })
                }

                if (!isValid(parseAddress.billing.city)) {
                    return res.status(400).send({ status: false, message: "please provide City for billing address" })
                }
                if (!addressCityRegex.test(parseAddress.billing.city.trim())) {
                    return res.status(400).send({ status: false, message: "please provide valid city for billing address" })
                }

                if (!isValid(parseAddress.billing.pincode)) {
                    return res.status(400).send({ status: false, message: "please provide Pincode for billing address" })
                }
                if (!pincodeRegex.test(parseAddress.billing.pincode)) {
                    return res.status(400).send({ status: false, message: "please provide valid pincode for billing address" })
                }
            }
            else {
                return res.status(400).send({ status: false, message: "please provide billing Address" })
            }
        }
        else {
            return res.status(400).send({ status: false, message: "please provide Address" })
        }

        //----------------------------- Checking Duplicate Email -----------------------------//
        let userEmail = await userModel.findOne({ email: email.trim() })
        if (userEmail) {
            return res.status(409).send({ status: false, message: "This e-mail address is already exist, Please enter another E-mail address" })
        }

        //----------------------------- Checking Duplicate Phone -----------------------------//
        let userNumber = await userModel.findOne({ phone: phone.trim() })
        if (userNumber) {
            return res.status(409).send({ status: false, message: "This phone number is already exist, Please enter another phone number" })
        }
        //upload to s3 and get the uploaded link
        let uploadedFileURL = await upload.uploadFile(files[0])
        data.profileImage = uploadedFileURL;

        const userData = {}

            userData.fname = fname.trim(),
            userData.lname = lname.trim(),
            userData.profileImage = data.profileImage,
            userData.email = email.trim(),
            userData.phone = phone.trim(),
            userData.password = data.password,
            userData.address = parseAddress,
            userData.address.shipping.street = parseAddress.shipping.street.trim().split(' ').filter(a => a).join(' '),
            userData.address.shipping.city = parseAddress.shipping.city.trim().split(' ').filter(a => a).join(' '),
            userData.address.billing.street = parseAddress.billing.street.trim().split(' ').filter(a => a).join(' '),
            userData.address.billing.city = parseAddress.billing.city.trim().split(' ').filter(a => a).join(' ')

        //----------------------------- Creating User Data -----------------------------//
        const document = await userModel.create(userData)
        res.status(201).send({ status: true, message: "User Created Successfully", data: document })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




/*############################################ 2.User Login #####################################################*/

const userLogin = async function (req, res) {
    try {
        const data = req.body

        //----------------------------- Validating body -----------------------------//
        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, message: "Please Enter Login Credentials..." })
        }

        const email = data.email
        const password = data.password

        //----------------------------- Validating Email -----------------------------//
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Please enter Email Id" })
        }
        if (!emailRegex.test(email.trim())) {
            return res.status(400).send({ status: false, message: "Email is not valid" })
        }

        //----------------------------- Validating Password -----------------------------//
        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "Please enter Password" })
        }
        if (!passwordRegex.test(password.trim())) {
            return res.status(400).send({ status: false, message: "password should be strong please use One digit, one upper case , one lower case ,one special character, it between 8 to 15" })
        }

        //----------------------------- Checking Credential -----------------------------//
        const user = await userModel.findOne({ email: email.trim() })

        if (user) {
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).send({ status: false, message: "Invalid Password Credential" });
            }
        }
        else {
            return res.status(401).send({ status: false, message: "Invalid email Credential" });
        }

        //----------------------------- Token Generation -----------------------------//
        const token = jwt.sign({
            userId: user._id.toString(),
            project: "doneBy50",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 120 * 60
        }, "doneBy50")

        res.setHeader("Authorization", token)
        const output = {
            userId: user._id,
            token: token
        }
        return res.status(200).send({ status: true, message: "User login successfull", data: output })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




/*############################################ 3. Get User ######################################################*/

const getUser = async function (req, res) {
    try {
        let userId = req.params.userId

        //----------------------------- Getting User Detail -----------------------------//
        let userData = await userModel.findById(userId)
        return res.status(200).send({ status: true, message: "User profile details", data: userData })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}




/*############################################ 4. Update User ###################################################*/

const updateUser = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        let files = req.files

        //----------------------------- Checking if user exist or not -----------------------------//
        let checkUser = await userModel.findOne({ _id: userId })
        if (!checkUser) {
            return res.status(404).send({ status: false, message: "User does not exist with this userId" })
        }

        let { fname, lname, email, phone, password, address, profileImage } = data

        //----------------------------- Validating body -----------------------------//
        if (!isValidBody(data) && !isValid(files)) {
            return res.status(400).send({ status: false, message: "please provide data in request body" })
        }

        if ('profileImage' in data) {
            if (Object.keys(profileImage).length === 0) {
                return res.status(400).send({ status: false, message: 'profileImage is empty, either provide file or deselect it.' })
            }
        }

        //first store all the keys of data in k and then compare with the valid fields stored in another veriable named b
        let k = Object.keys(data)
        let b = ['fname', 'lname', 'email', 'phone', 'password', 'address']

        //if keys of provided data do not matches with the element in b then it will return the response here only 
        if (!(k.every(r => b.includes(r)))) {
            return res.status(400).send({ status: false, message: "Please provide valid field name as 'fname, lname, email, phone, password, address, profileImage' only" })
        }

        //----------------------------- Updating Profile Image -----------------------------//       
        if (files && files.length != 0) {
            //if key of provided file do not matches with 'profileImage' then it will return the response here only 
            if (!(files[0].fieldname === "profileImage")) {
                return res.status(400).send({ status: false, message: "Please provide valid field name as 'profileImage' only" })
            }

            let check = files[0].originalname.split(".")
            const extension = ["png", "jpg", "jpeg", "webp"]
            if (extension.indexOf(check[check.length - 1]) == -1) {
                return res.status(400).send({ status: false, message: "Please provide image only" })
            }
            let uploadedFileURL = await upload.uploadFile(files[0])
            checkUser.profileImage = uploadedFileURL
        }

        //----------------------------- Updating fname -----------------------------//
        if ("fname" in data) {
            if (!isValid(fname) || !NameRegex.test(fname.trim())) {
                return res.status(400).send({ status: false, message: "first name should contain alphabetic character only" })
            } checkUser.fname = fname.trim()
        }

        //----------------------------- Updating lname -----------------------------//
        if ("lname" in data) {
            if (!isValid(lname) || !NameRegex.test(lname.trim())) {
                return res.status(400).send({ status: false, message: "last name should contain alphabetic character only" })
            } checkUser.lname = lname.trim()
        }

        //----------------------------- Updating email -----------------------------//
        if ("email" in data) {
            if (!isValid(email) || !emailRegex.test(email.trim())) {
                return res.status(400).send({ status: false, message: "email is not Valid" })
            }
            let uniqueEmail = await userModel.findOne({ email: email.trim() })
            if (uniqueEmail) {
                return res.status(409).send({ status: false, message: "This email already exists, Please try another one." })
            } checkUser.email = email.trim()
        }

        //----------------------------- Updating phone -----------------------------//
        if ("phone" in data) {
            if (!isValid(phone) || !phoneRegex.test(phone.trim())) {
                return res.status(400).send({ status: false, message: "Phone no is not Valid" })
            }
            let uniquePhone = await userModel.findOne({ phone: phone.trim() })
            if (uniquePhone) {
                return res.status(409).send({ status: false, message: "This phone number already exists, Please try another one." })
            } checkUser.phone = phone.trim()
        }

        //----------------------------- Updating Bcrypted Password -----------------------------//
        if ("password" in data) {
            if (passwordRegex.test(password)) {
                let saltRounds = await bcrypt.genSalt(10)
                password = await bcrypt.hash(password.trim(), saltRounds)
            }
            else {
                return res.status(400).send({ status: false, message: "password should be strong please use One digit, one upper case , one lower case ,one special character, it between 8 to 15" })
            }
            checkUser.password = password
        }

        //----------------------------- Updating Address -----------------------------//
        if ("address" in data) {
            try {
                var parseAddress = JSON.parse(address)
            }
            catch (error) {
                return res.status(400).send({ status: false, message: "Pincode should not start from 0 or Address should be in Object form" })
            }

            //----------------------------- Updating Shipping Address -----------------------------//           
            if (parseAddress.shipping) {
                if (parseAddress.shipping.street) {
                    if (!addressStreetRegex.test(parseAddress.shipping.street)) {
                        return res.status(400).send({ status: false, message: "Invalid Shipping street" })
                    } checkUser.address.shipping.street = parseAddress.shipping.street.trim().split(' ').filter(a => a).join(' ')
                }

                if (parseAddress.shipping.city) {
                    if (!addressCityRegex.test(parseAddress.shipping.city)) {
                        return res.status(400).send({ status: false, message: "Invalid Shipping city" })
                    } checkUser.address.shipping.city = parseAddress.shipping.city.trim().split(' ').filter(a => a).join(' ')
                }

                if (parseAddress.shipping.pincode) {
                    if (!pincodeRegex.test(parseAddress.shipping.pincode)) {
                        return res.status(400).send({ status: false, message: "Invalid Shipping pincode" })
                    } checkUser.address.shipping.pincode = parseAddress.shipping.pincode
                }
            }

            //----------------------------- Updating Billing Address -----------------------------//
            if (parseAddress.billing) {
                if (parseAddress.billing.street) {
                    if (!addressStreetRegex.test(parseAddress.billing.street)) {
                        return res.status(400).send({ status: false, message: "Invalid billing street" })
                    } checkUser.address.billing.street = parseAddress.billing.street.trim().split(' ').filter(a => a).join(' ')
                }

                if (parseAddress.billing.city) {
                    if (!addressCityRegex.test(parseAddress.billing.city)) {
                        return res.status(400).send({ status: false, message: "Invalid billing city" })
                    } checkUser.address.billing.city = parseAddress.billing.city.trim().split(' ').filter(a => a).join(' ')
                }

                if (parseAddress.billing.pincode) {
                    if (!pincodeRegex.test(parseAddress.billing.pincode)) {
                        return res.status(400).send({ status: false, message: "Invalid Billing pincode" })
                    } checkUser.address.billing.pincode = parseAddress.billing.pincode
                }
            }
        }

        //----------------------------- Saving Updates -----------------------------//
        await checkUser.save()
        return res.status(200).send({ status: true, message: "User profile details", data: checkUser })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}



module.exports = { createUser, userLogin, getUser, updateUser }