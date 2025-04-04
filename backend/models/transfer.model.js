const mongoose = require("mongoose");

const TransferLogSchema = new mongoose.Schema({
  espId: { type: String, required: true },
  amount: { type: Number, required: true },
  transactionHash: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["IN_PROGRESS", "COMPLETED", "FAILED"],
    default: "IN_PROGRESS"
  }
}, { timestamps: true });

module.exports = mongoose.model("TransferLog", TransferLogSchema);