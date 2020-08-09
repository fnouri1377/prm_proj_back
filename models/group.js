const mongoose = require("mongoose");

const groupSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    name: String,
    note: String,
    contacts: [String]
});

module.exports = mongoose.model("Group", groupSchema, "groups");