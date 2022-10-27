const mongoose = require('mongoose');

const { Schema } = mongoose;
const newSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    guild: {
        type: String
    },
    channel: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    command: {
        type: String,
        required: true
    },
    subCommandGroup: {
        type: String
    },
    subCommand: {
        type: String
    },
    commandName: {
        type: String,
        required: true
    },
    options: {
        type: JSON,
        required: true
    },
    createdAt: {
        type: Number,
        required: true,
        default: Date.now
    },
    locale: {
        type: String
    }
});

module.exports = mongoose.model('CommandHistory', newSchema);