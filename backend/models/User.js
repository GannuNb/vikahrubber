const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    location: {
        type: String,
    },
    businessProfiles: [
        {
            companyName: { type: String, required: true },
            phoneNumber: { type: String, required: true },
            email: { type: String, required: true },
            
            gstNumber: { type: String, required: true },          // New Field
            billAddress: { type: String, required: true },        // New Field
            shipAddress: { type: String, required: true },
        }
    ]
});

module.exports = mongoose.model('User', UserSchema);
