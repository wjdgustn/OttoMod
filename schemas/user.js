
const mongoose = require('mongoose');

const { Schema } = mongoose;
const newSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
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
    },
    lang: {
        type: String,
        required: true,
        default: 'en'
    }
});

module.exports = mongoose.model('User', newSchema);