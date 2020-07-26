const mongoose = require("mongoose");

const debtScheduleSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    username: String,
    contact_name: String,
    amount: Number, // Toman
    scheduleType: String, // 'debt_userToCon' or 'debt_conToUser'
    scheduleObject: Object // node-schedule
});

module.exports = mongoose.model("DebtSchedule", debtScheduleSchema, "debtSchedules");