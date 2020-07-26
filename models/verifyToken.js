const mongoose = require("mongoose");

const verifyTokenSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    phone_number: String,
    username: String,
    token: Number,
    send_date: Date
});

module.exports = mongoose.model("VerifyToken", verifyTokenSchema, "verifyTokens");