const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sellerSchema = new Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    price: { type: Number, required: true },
    espId: {  // Changed from espId
        type: String,
        required: true
    },
    currentStateOfCharge: { 
        type: Number,  // Changed from String
        required: true
    },
    energyQuota: {
        type: Number,  // Changed from String
        required: true
    },
    blockchainAddress: { type: String, required: true }
}, { 
    timestamps: true  // Replaces createdOn, adds createdAt and updatedAt
});

module.exports = mongoose.model("Seller", sellerSchema);