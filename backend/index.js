require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");

mongoose.connect(config.connectionString);

const User = require("./models/user.model")
const Seller = require("./models/seller.model")

const express = require("express");
const cors = require("cors");
const app = express();

const jwt = require("jsonwebtoken")
const { authenticateToken } = require("./utilites")

app.use(express.json());

app.use(
    cors({
        origin: "*"
    })
);

app.get("/" , (req,res) => {
    res.json({data : "hello"});
});

//create account
app.post("/create-account" , async (req ,res) => {

    const {fullName , email , password , seller } = req.body;

    if(!fullName) {
        return res
        .status(400)
        .json({error: true , message: "Full Name is required"});
    }
    if(!email) {
        return res
        .status(400)
        .json({error: true , message: "Email is required"});
    }
    if(!password) {
        return res
        .status(400)
        .json({error: true , message: "Password is required"});
    }
    

    const isUser = await User.findOne({email: email})

    if(isUser){
        return res.json({
            error: true,
            message: "User already exist"
        });
    }

    const user = new User({
        fullName , email , password , seller
    })

    await user.save();

    const accessToken = jwt.sign({ user } , process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "36000m",
    })

    return res.json({
        error: false,
        user,
        accessToken,
        message: "Registeration Successful"
    })
})

//login
app.post("/login" , async (req , res) => {
    const {email , password } = req.body;

    if(!email) {
        return res.status(400).json({
            error: true ,
            message: "Email is Required"
        })
    }

    if(!password) {
        return res.status(400).json({
            error: true ,
            message: "Password is Required"
        })
    }

    const userInfo = await User.findOne({email : email});

    if(!userInfo) {
        return res.status(400).json({
            error : true,
            message : "User does not Exist"
        })
    }

    if(userInfo.email == email && userInfo.password == password){
        const user = {user : userInfo};
        const fullName = userInfo.fullName;
        const seller = userInfo.seller;
        const accessToken = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET , {
            expiresIn: "36000m",
        })

        return res.json({
            error: false,
            message : "Loged in succesfully",
            email,
            fullName,
            seller,
            accessToken
        })
    }
    else {
        return res.status(400).json({
            error: true,
            message: "Invalid Credentials"
        })
    }
})

app.post("/addSellerForm", authenticateToken, async (req, res) => {
    const { fullName , email, price , powerToBeTransForm , currentStateOfCharge , unitNo  } = req.body;

    if (!fullName) {
        return res.status(400).json({
            error: true,
            message: "FullName is required"
        });
    }

    if (!email) {
        return res.status(400).json({
            error: true,
            message: "Email is required"
        });
    }
    if (!price) {
        return res.status(400).json({
            error: true,
            message: "Price is required"
        });
    }

    if (!powerToBeTransForm) {
        return res.status(400).json({
            error: true,
            message: "Power To Be TransForm is required"
        });
    }
    if (!currentStateOfCharge) {
        return res.status(400).json({
            error: true,
            message: "Current State Of Charge is required"
        });
    }
    if (!unitNo) {
        return res.status(400).json({
            error: true,
            message: "Unit Number is required"
        });
    }

    try {

        const userInfo = await User.findOne({email : email});

        if(!userInfo){
            return res.status(404).json({
                error: true,
                message: "User not found"
            })
        }

        userInfo.seller = true;

        await userInfo.save();

        

        const seller = new Seller({
            fullName,
            email, 
            price , 
            powerToBeTransForm , 
            currentStateOfCharge , 
            unitNo
        });
        await seller.save();

        

        return res.json({
            error: false,
            seller,
            message: "Seller added successfully",
        });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: true,
            message: "Internal server error"
        });
    }
});

app.get("/getSellers", authenticateToken, async (req, res) => {
    try {
        // Fetch all sellers from the database
        const sellers = await Seller.find({});

        // Return the list of sellers
        return res.json({
            error: false,
            sellers,
            message: "Sellers fetched successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: true,
            message: "Internal server error",
        });
    }
});

app.listen(8000);

module.exports = app;