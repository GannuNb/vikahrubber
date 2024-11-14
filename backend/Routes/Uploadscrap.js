// routes/uploadscrap.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose'); // Needed for transactions
const Uploadscrap = require('../models/Uploadscrap');

const ScrapItem = require('../models/ScrapItem');
const authenticateToken = require('../middleware/authenticateToken');
const User = require('../models/User');
const nodemailer = require('nodemailer');

router.post('/uploadscrap', [
    authenticateToken,
    body('material').isIn(['Tyre scrap', 'pyro oil', 'Tyre steel scrap']).withMessage('Invalid material type'),
    body('application').notEmpty().withMessage('Application is required'),
    body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be a positive number'),
    body('companyName').notEmpty().withMessage('Company Name is required'),
    body('phoneNumber').notEmpty().withMessage('Phone Number is required'),
    body('email').isEmail().withMessage('Valid Email is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { material, application, quantity, companyName, phoneNumber, email } = req.body;

    try {
        // Find user by ID extracted from token
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Create new scrap item with associated user ID
        const newScrap = new Uploadscrap({
            user: req.user.id, // Save user ID with scrap item
            material,
            application,
            quantity,
            companyName,
            phoneNumber,
            email
        });

        await newScrap.save();
        res.status(201).json({ success: true, message: 'Scrap details uploaded successfully', scrap: newScrap });
    } catch (error) {
        console.error('Error uploading scrap details:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});


// @route   GET /api/getuploadedscrap
// @desc    Get all uploaded scrap details
// @access  Private (Authenticated users)
router.get('/getuploadedscrap', authenticateToken, async (req, res) => {
    try {
        const uploadedScrapItems = await Uploadscrap.find()
            .populate('user', '_id name'); // Adjust to include specific fields if needed
        if (!uploadedScrapItems.length) {
            return res.status(404).json({ message: 'No uploaded scrap items found' });
        }
        res.json({ uploadedScrapItems });
    } catch (err) {
        console.error('Error fetching uploaded scrap items:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});


const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use your email service
    auth: {
        user: process.env.EMAIL_USER, // your email address
        pass: process.env.EMAIL_PASS, // your email password
    }
});

const Approval = require('../models/Approval'); // Import Approval model

// routes/uploadscrap.js

router.post('/approveScrap/:id', authenticateToken, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const uploadedScrap = await Uploadscrap.findById(req.params.id).session(session);
        if (!uploadedScrap) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Scrap item not found' });
        }

        const { material, application, quantity, email, companyName } = uploadedScrap;

        const existingScrapItem = await ScrapItem.findOne({
            type: { $regex: new RegExp(`^${material}$`, 'i') },
            name: { $regex: new RegExp(`^${application}$`, 'i') },
        }).session(session);

        if (existingScrapItem) {
            existingScrapItem.available_quantity += quantity;
            await existingScrapItem.save({ session });

            // Save approval record with only posted user ID
            const approval = new Approval({
                scrapItem: uploadedScrap._id,
                postedBy: uploadedScrap.user, // Store the user ID of the posted user
                material,
                application,
                quantity,
                companyName,
                email
            });
            await approval.save({ session });

            // Remove approved scrap from Uploadscrap collection
            await Uploadscrap.findByIdAndDelete(req.params.id).session(session);

            // Send confirmation email
            const mailOptions = {
                from: 'r180685@rguktrkv.ac.in',
                to: email,
                subject: 'Scrap Approval Confirmation',
                text: `Your scrap item has been approved successfully!\n\nMaterial: ${material}\nApplication: ${application}\nQuantity: ${quantity}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log('Email sent:', info.response);
                }
            });

            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({ message: 'Scrap approved, quantity updated, and email sent.' });
        } else {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'No matching scrap item found; approval failed.' });
        }
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error approving scrap item:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});




// @route   DELETE /api/denyScrap/:id
// @desc    Deny scrap submission
// @access  Private (Authorized users)
router.delete('/denyScrap/:id', authenticateToken, async (req, res) => {
    try {
        // Use findByIdAndDelete instead of .remove()
        const deletedScrap = await Uploadscrap.findByIdAndDelete(req.params.id);
        
        if (!deletedScrap) {
            return res.status(404).json({ message: 'Scrap item not found' });
        }

        res.status(200).json({ message: 'Scrap submission denied and removed.' });
    } catch (error) {
        console.error('Error denying scrap item:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/getApprovedScrap', authenticateToken, async (req, res) => {
    try {
        // Find approvals for scraps uploaded by the logged-in user
        const approvedScrap = await Approval.find({ postedBy: req.user.id }) // Filter by user ID
            .populate('scrapItem', 'material application quantity companyName email') // Populate scrap item details
            .select('-postedBy'); // Optionally exclude the postedBy from the response if not needed

        if (!approvedScrap.length) {
            return res.status(404).json({ message: 'No approved scrap items found for this user.' });
        }

        res.json({ approvedScrap });
    } catch (error) {
        console.error('Error fetching approved scrap:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});



module.exports = router;
