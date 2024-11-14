const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const mailRoutes = require('./Routes/Mail');
const placeOrderRoute = require('./Routes/PlaceOrder');
const contactRoute = require('./Routes/Contactus');

const app = express();
const port = process.env.PORT || 5000;
const BusinessProfile = require('./models/BusinessProfile');
const User = require('./models/User');

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
    startPeriodicSave();
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

const startPeriodicSave = () => {
    setInterval(async () => {
        try {
            const scrapItems = await mongoose.connection.db.collection("scrapitems").find({}).toArray();
            global.scrap_items = scrapItems;
            console.log("Data refreshed and saved:", scrapItems.length, "items.");
        } catch (err) {
            console.error("Error during periodic save:", err);
        }
    }, 5000); // 5 seconds
};

app.get('/business-profile', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user.id;

        const user = await User.findById(userId);
        if (!user || !user.businessProfiles || user.businessProfiles.length === 0) {
            return res.status(200).json({ profileExists: false, message: 'Business profile not found' });
        }

        const businessProfile = user.businessProfiles[0];
        return res.status(200).json({ profileExists: true, businessProfile });
    } catch (error) {
        console.error('Error fetching business profile:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
});

app.post('/business-profile', async (req, res) => {
    try {
        const { companyName, phoneNumber, email, gstNumber, billAddress, shipAddress } = req.body;

        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user.id;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if a business profile already exists
        if (user.businessProfiles && user.businessProfiles.length > 0) {
            return res.status(400).json({ success: false, message: "Business profile already exists" });
        }

        const newProfile = {
            companyName,
            phoneNumber,
            email,
            gstNumber,
            billAddress,
            shipAddress,
        };

        user.businessProfiles.push(newProfile);
        await user.save();

        res.status(201).json({ success: true, message: "Business profile created successfully" });
    } catch (error) {
        console.error("Error creating business profile:", error); // Log the error object for better debugging
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
        }
    }
});

app.get('/scrap', (req, res) => {
    res.json({
        scrap_items: global.scrap_items,
      
    });
});




// Import and use routes
const uploadscrapRoute = require('./Routes/Uploadscrap');
const createUserRoute = require('./Routes/CreateUser');

const adminRoutes = require('./Routes/AdminRoutes'); // Corrected variable name
app.use('/api', require('./Routes/OrderRoutes'));

app.use('/api', adminRoutes); // Mount AdminRoutes at /api
app.use('/api', placeOrderRoute);

app.use('/api', contactRoute);


app.use('/api', mailRoutes);
app.use('/api', uploadscrapRoute);
app.use('/api', createUserRoute);
app.get('/', (req, res) => {
    res.send('Hello Worldd!');
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
