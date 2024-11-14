// routes/Contactus.js
const express = require('express');
const nodemailer = require('nodemailer');
const Contact = require('../models/Contactus'); // Import the Contact model

const router = express.Router();

router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // Save the contact form submission in the database
    const contact = new Contact({ name, email, message });
    await contact.save();

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email options
    const mailOptions = {
      from: email,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Contact Form Submission',
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Your message has been sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending message, please try again later.' });
  }
});

module.exports = router;
