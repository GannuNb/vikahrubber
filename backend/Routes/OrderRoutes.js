// Routes/OrderRoutes.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');
const ScrapItem = require('../models/ScrapItem'); // Updated import

// Middleware to authenticate and attach user to request
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('Authorization header missing');
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Assuming the token has a 'user' field
    console.log('User authenticated:', req.user);
    next();
  } catch (error) {
    console.log('Invalid token:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

router.post('/place-order', authenticate, async (req, res) => {
    console.log('Received order request:', req.body);
    try {
      const { itemName, requiredQuantity } = req.body;
  
      if (!itemName || !requiredQuantity) {
        console.log('Validation failed: Missing itemName or requiredQuantity');
        return res.status(400).json({ message: 'Item name and required quantity must be provided' });
      }
  
      const scrapItem = await ScrapItem.findOne({ name: itemName });
      if (!scrapItem) {
        console.log(`Scrap item not found: ${itemName}`);
        return res.status(404).json({ message: 'Scrap item not found' });
      }
  
      console.log(`Scrap item found: ${scrapItem.name}, Available: ${scrapItem.available_quantity}`);
  
      if (scrapItem.available_quantity < requiredQuantity) {
        console.log(`Insufficient quantity: Requested ${requiredQuantity}, Available ${scrapItem.available_quantity}`);
        return res.status(400).json({ message: 'Insufficient quantity available' });
      }
  
      const pricePerTon = scrapItem.price;
      const subtotal = pricePerTon * requiredQuantity;
      const gst = subtotal * 0.18;
      const totalPrice = subtotal + gst;
  
      console.log(`Order Calculation - Subtotal: ${subtotal}, GST: ${gst}, Total: ${totalPrice}`);
  
      scrapItem.available_quantity -= requiredQuantity;
      await scrapItem.save();
      console.log(`Updated scrap item quantity: ${scrapItem.available_quantity}`);
  
      const newOrder = new Order({
        user: req.user.id,
        itemName,
        availableQuantity: scrapItem.available_quantity + requiredQuantity,
        pricePerTon,
        requiredQuantity,
        subtotal,
        gst,
        totalPrice,
      });
  
      await newOrder.save();
      console.log('Order saved successfully:', newOrder);
  
      res.status(200).json({
        message: 'Order placed successfully',
        remainingQuantity: scrapItem.available_quantity,
        order: newOrder,
      });
    } catch (error) {
      console.error('Error placing order:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // Route to get orders for the authenticated user
router.get('/orders', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId }).populate('user', 'email');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

  

module.exports = router;
