// routes/PlaceOrder.js
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const router = express.Router();
const jwt = require('jsonwebtoken');
const ScrapItem = require('../models/ScrapItem');
require('dotenv').config();

// Middleware for authentication
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Configure multer for file uploads
const upload = multer();

// Place order route
router.post('/place-order', authenticate, async (req, res) => {
  const { itemName, requiredQuantity } = req.body;

  if (!itemName || !requiredQuantity) {
    return res.status(400).json({ message: 'Item name and required quantity are required.' });
  }

  try {
    const item = await ScrapItem.findOne({ name: itemName });
    if (!item) return res.status(404).json({ message: 'Item not found.' });

    if (item.available_quantity < requiredQuantity) {
      return res.status(400).json({ message: 'Not enough quantity available.' });
    }

    item.available_quantity -= requiredQuantity;
    await item.save();

    res.status(200).json({ message: 'Order placed successfully.', remainingQuantity: item.available_quantity });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'An error occurred while placing the order.' });
  }
});

// Upload PDF and send email route
router.post('/upload-pdf', authenticate, upload.single('pdf'), async (req, res) => {
  const { userEmail } = req.body;
  const pdfFile = req.file;

  if (!userEmail || !pdfFile) {
    return res.status(400).json({ message: 'User email and PDF file are required.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Order Summary',
      text: 'Please find attached the order summary for your recent order.',
      attachments: [
        {
          filename: 'order-summary.pdf',
          content: pdfFile.buffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email.' });
  }
});

module.exports = router;
