const mongoose = require("mongoose");

const relationScheduleSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    username: String,
    contact_name: String,
    duration: Number,
    scheduleType: String, // 'message' or 'call' or 'meeting'
    scheduleObject: Object // node-schedule
});

module.exports = mongoose.model("RelationSchedule", relationScheduleSchema, "relationSchedules");