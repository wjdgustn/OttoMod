const mongoose = require('mongoose');

const { Schema } = mongoose;
const newSchema = new Schema({
    ticketThread: {
        type: String,
        required: true
    },
    dmMessage: {
        type: String,
        required: true,
        unique: true
    },
    webhookMessage: {
        type: String,
        required: true,
        unique: true
    }
});

module.exports = mongoose.model('TicketMessage', newSchema);