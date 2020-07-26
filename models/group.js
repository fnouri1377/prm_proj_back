const mongoose = require("mongoose");

const groupSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    name: String,
    // duration_message: Number, // chand rooz yek bar mikham be afrade in group message bedam?
    // duration_call: Number, // chand rooz yek bar mikham be afrade in group zang bezanam?
    // duration_meeting: Number, // chand rooz yek bar mikham afrade in group ro bebinam?
    note: String,
    contacts: [String]
});

module.exports = mongoose.model("Group", groupSchema, "groups");