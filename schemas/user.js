
const mongoose = require('mongoose');

const { Schema } = mongoose;
const newSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    blacklist: {
        type: Boolean,
        required: true,
        default: false
    },
    trackError: {
        type: Boolean,
        required: true,
        default: false
    },
    ephemeralOnly: {
        type: Boolean,
        required: true,
        default: false
    }
});

module.exports = mongoose.model('User', newSchema);