const mongoose = require("mongoose");

const contactSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    name: String,
    birthDate: Date,
    debt_userToCon: Number, // The user must return this money to the contact.
    debt_conToUser: Number, // The contact must return this money to the user.
    note: String,
    duration_message: Number, // chand rooz yek bar mikham be in contact message bedam?
    duration_call: Number, // chand rooz yek bar mikham be in contact zang bezanam?
    duration_meeting: Number, // chand rooz yek bar mikham in contact ro bebinam?
    groups: [String]
});

module.exports = mongoose.model("Contact", contactSchema, "contacts");