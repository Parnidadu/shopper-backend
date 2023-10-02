const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Shop = require('./models/Shop');
const Product = require('./models/Product');
const SECRET_KEY = '123456';
const app = express();
require('dotenv').config()
// console.log("process environment",process.env)
const PORT = process.env.PORT || 5000;


app.use(bodyParser.json());
app.use(cors());

// MongoDB connection setup
mongoose.connect(process.env.MONGO_URL, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    //   useCreateIndex: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, phoneNumber, email, password } = req.body;
        //   if(User.findOne(email)){
        //     console.log("finding",User.findOne(email))
        //     res.json({ message: 'User already exist try something else'});
        //   }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, phoneNumber, email, password: hashedPassword });
        await user.save();
        const token = jwt.sign({ userId: user._id }, SECRET_KEY); // Create a JWT token
        res.json({ message: 'User registered successfully', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, SECRET_KEY); // Create a JWT token
        res.json({ message: 'Login successful', token, userId: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access Denied' });

    try {
        console.log("here I ", token)
        const verified = jwt.verify(token, '123456')
        console.log("verified", verified)
        req.user = verified;
        next();
    } catch (error) {
        res.status(401).json({ error: error });
    }
}

// Protected route: Create a new shop
app.post('/api/shops', verifyToken, async (req, res) => {
    try {
        const { name, bio, address, latitude, longitude } = req.body;
        const shop = new Shop({ name, bio, address, latitude, longitude, userId: req.user.userId });
        await shop.save();
        res.json(shop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Protected route: Create a new product
app.post('/api/products', verifyToken, async (req, res) => {
    try {
        const { name, description, price, tags, availableStock, shopId } = req.body;
        console.log("userId", req.user)
        const userId = req.user.userId
        console.log("name and desc", name, description, userId)
        const product = new Product({ name, description, price, tags, availableStock, shopId, userId });
        console.log("product", product)
        await product.save();
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Protected route: Get shops for a specific user
app.get('/api/shops', verifyToken, async (req, res) => {
    try {
        const shops = await Shop.find({ userId: req.user.userId });
        res.json(shops);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Protected route: Get products for a specific shop
app.get('/api/products/:shopId', verifyToken, async (req, res) => {
    try {
        console.log("products", Product)
        const products = await Product.find({ shopId: req.params.shopId, userId: req.user.userId });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error, msg: 'Internal Server Error' });
    }
});
// Protected route: Get details of a product 
app.get('/api/product/:productId', verifyToken, async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.find({ _id: productId});
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error, msg: 'Internal Server Error' });
    }
});
// Protected route: Update a product
app.put('/api/products/:productId', verifyToken, async (req, res) => {
    try {
        const { name, description, price, tags, availableStock } = req.body;
        const productId = req.params.productId;

        const product = await Product.findOne({ _id: productId, userId: req.user.userId });
        console.log("product", product)
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        product.name = name;
        product.description = description;
        product.price = price;
        product.tags = tags;
        product.availableStock = availableStock;

        await product.save();
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Protected route: Delete a product
app.delete('/api/products/:productId', verifyToken, async (req, res) => {
    try {
        const productId = req.params.productId;

        const product = await Product.findOne({ _id: productId, userId: req.user.userId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await Product.deleteOne({ _id: productId });
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});