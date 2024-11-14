// middleware/authenticateToken.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access Denied: No Token Provided' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded.user; // Assuming your token payload has a 'user' object
        next();
    } catch (err) {
        console.error('Token verification failed:', err);
        return res.status(403).json({ success: false, message: 'Invalid Token' });
    }
};

module.exports = authenticateToken;
