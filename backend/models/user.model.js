const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullName: { type: String },
    email: { type: String },
    password: { type: String },
    seller : { type: Boolean },
    createdOn: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
