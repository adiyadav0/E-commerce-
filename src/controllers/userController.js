const userModel = require("../models/userModel");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

/*############################################ VALIDATIONS ##########################################################*/

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
}

/*############################################ REGISTER USER ##########################################################*/

const userRegistration = async (req, res) => {
    try {
        let userData = req.body

        ///<--------------req validation-------------------------------------------->
        if (Object.keys(userData).length == 0) {
            return res.status(400).send({ status: false, msg: "Request Cannot Be Empty" })
        }

        let { fname, lname, email, phone, password, address } = userData

        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: "First Name is required" })
        }

        if (!(/^[A-Za-z ]+$/.test(fname))) {
            return res.status(400).send({ status: false, message: "First Name should be in alphabetic character" });
        }

        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: "Last Name is required" });
        }

        if (!(/^[A-Za-z ]+$/.test(lname))) {
            return res.status(400).send({ status: false, message: "Last Name should be in alphabetic character" });
        }

        
        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "Phone Number is required" })
        }

        if (!(/^[6-9]\d{9}$/.test(phone))) {
            return res
                .status(400)
                .send({ status: false, message: "Please give 10 digit Phone Number starting with (6-9)." })
        }

        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Email Id is required" })
        }

        if (!isValid(password)) {
            return res
                .status(400)
                .send({ status: false, message: "Password is required" })
        }

        // if (!isValid(address)) {
        //     return res
        //         .status(400)
        //         .send({ status: false, message: "Address is required" })
        // }

        ///<-----------------------------mobile number checking ---------------------------->

        let phoneNumChecking = await userModel.findOne({ phone: phone })

        if (phoneNumChecking) {
            return res
                .status(400)
                .send({ status: false, message: "This Phone Number already exist." });
        }

        ///<------------------------ Email validation ---------------------------------------->
        const validateEmail = function (mail) {
            if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
                return true;
            }
        }

        if (!validateEmail(userData.email)) {
            return res
                .status(400)
                .send({ status: false, message: "Incorrect Email !!!" })
        }

        const emailChecking = await userModel.findOne({ email: userData.email })

        if (emailChecking) {
            return res
                .status(400)
                .send({ status: false, message: "This Email already exist." })
        }


        ////<----------------------- Password validation ------------------------------->
        const validatePassword = function (password) {
            if (/^[A-Za-z\W0-9]{8,15}$/.test(password)) {
                return true;
            }
        }

        if (!validatePassword(userData.password)) {
            return res
                .status(400)
                .send({ status: false, message: "Password Should be 8-15 Characters." })
        }

        ////<----------------------- Address validation ------------------------------->

        if (!(/^[A-Za-z]+$/.test(city))) {
            return res
                .status(400)
                .send({ status: false, message: "Please use Alphabets in City." });
        }

        if (!(/^[0-9]{6}$/.test(pincode))) {
            return res
                .status(400)
                .send({ status: false, message: "Please use 6 Digit Numbers in Pincode." });
        }

        ///<-----------------------------created part ---------------------------------->
        const userCreated = await userModel.create(userData);
        return res.status(201).send({ status: true, message: 'Success', data: userCreated });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

    