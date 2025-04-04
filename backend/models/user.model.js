const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullName: { type: String , required: true },
    email: { type: String , required: true },
    password: { type: String , required: true },
    seller : { type: Boolean , required: true },
    blockchainAddress: { type: String , required: true },
    privateKey: { type: String , required: true } , // Store encrypted in production
    balance : {type: Number , required: true},
    espId : {type : String , required: true},
    createdOn: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
