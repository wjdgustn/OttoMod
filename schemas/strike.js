const mongoose = require('mongoose');

const { Schema } = mongoose;
const newSchema = new Schema({
    user: {
        type: String,
        required: true
    },
    rule: {
        type: Number,
        required: true,
        min: 1
    },
    createdAt: {
        type: Number,
        required: true,
        default: Date.now
    },
    expiresAt: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    evidence: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Strike', newSchema);