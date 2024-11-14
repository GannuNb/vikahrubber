// models/Approval.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ApprovalSchema = new Schema({
    scrapItem: {
        type: Schema.Types.ObjectId,
        ref: 'Uploadscrap',
        required: true
    },
    approvedAt: {
        type: Date,
        default: Date.now
    },
    material: {
        type: String,
        required: true
    },
    application: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    postedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    }
});

module.exports = mongoose.model('Approval', ApprovalSchema);
