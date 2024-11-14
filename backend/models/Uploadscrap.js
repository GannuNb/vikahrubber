const mongoose = require('mongoose');
const { Schema } = mongoose;

const UploadscrapSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    material: {
        type: String,
        enum: ['Tyre scrap', 'pyro oil', 'Tyre steel scrap'],
        required: true
    },
    application: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [0, 'Quantity cannot be negative']
    },
    companyName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

// Export as a model
module.exports = mongoose.model('Uploadscrap', UploadscrapSchema);
