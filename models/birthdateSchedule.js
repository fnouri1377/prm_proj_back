const mongoose = require("mongoose");

const birthdateScheduleSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    username: String,
    contact_name: String,
    day: Number,
    month: Number,
    scheduleObject: Object // node-schedule
});

module.exports = mongoose.model("BirthdateSchedule", birthdateScheduleSchema, "birthdateSchedules");