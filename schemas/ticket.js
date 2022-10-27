const mongoose = require('mongoose');

const { Schema } = mongoose;
const newSchema = new Schema({
    user: {
        type: String,
        required: true,
        unique: true
    },
    channel: {
        type: String,
        required: true,
        unique: true
    },
    anonymous: {
        type: Boolean,
        required: true,
        default: false
    },
    createdAt: {
        type: Number,
        required: true,
        default: Date.now
    },
    lastMessageAt: {
        type: Number,
        required: true,
        default: Date.now
    },
    moderatorReplied: {
        type: Boolean,
        required: true,
        default: false
    },
    useReminder: {
        type: Boolean,
        required: true,
        default: true
    }
});

module.exports = mongoose.model('Ticket', newSchema);