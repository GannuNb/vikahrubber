const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the BusinessProfile Schema
const BusinessProfileSchema = new Schema({
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
        required: true,
        unique: true
    },
   
        gstNumber: { type: String, required: true },          // New Field
   billAddress: { type: String, required: true },        // New Field
     shipAddress: { type: String, required: true },
});

// Create and export the BusinessProfile model
module.exports = mongoose.model('BusinessProfile', BusinessProfileSchema);
