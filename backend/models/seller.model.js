const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sellerSchema = new Schema({
    fullName: { type: String  , required: true},
    email: { type: String , required: true},
    price: { type: Number , required: true},
    powerToBeTransForm :{ type: String , required: true},
    currentStateOfCharge :{ type: String , required: true},
    unitNo :{ type: String , required: true},
    blockchainAddress: { type: String },
    createdOn: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Seller", sellerSchema);
