const express = require('express');
const multer = require('multer');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { connectToDatabase, getClient } = require('./db');
const app = express();
const PORT = process.env.PORT || 3000;
const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 'myPassword';
bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
  // Store hash in your password DB.
});

// MongoDB connection string with 'p2ecommerce' database
const mongoURI = 'mongodb://localhost:27017/p2ecommerce';
// Database name
const dbName = 'p2ecommerce';

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Middleware to parse JSON data in requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
let db;

// Function to connect to MongoDB
async function connectToMongoDB() {
  try {
    const client = await MongoClient.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/image/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Express middleware to serve static files from the 'public' directory
app.use(express.static('public'));

// Express middleware to parse JSON data in requests
app.use(express.json());

// Serve admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API to get products
//app.get('/api/products', async (req, res) => {
  //const products = await db.collection('products').find().toArray();

  // Prepend 'image/' to image filenames
  //const productsWithImagePath = products.map(product => ({
   // ...product,
  //  image: `image/${product.image}`,
  //}));

  //res.json(productsWithImagePath);
//});

// API to get product details by ID
app.get('/api/products/:id', async (req, res) => {
  const productId = req.params.id;
  const product = await db.collection('products').findOne({ _id: ObjectId(productId) });

  // Prepend 'image/' to image filename
  const productWithImagePath = {
    ...product,
    image: `image/${product.image}`,
  };

  res.json(productWithImagePath);
});

// API to add a new product
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description } = req.body;

    // Check if req.file is defined before accessing properties
    if (req.file) {
      const newProduct = {
        name,
        price,
        description,
        image: req.file.filename, // Set the correct image filename
      };

      const result = await db.collection('products').insertOne(newProduct);
      res.status(201).json({ _id: result.insertedId });
    } else {
      // Handle the case where no file is uploaded
      res.status(400).json({ error: 'No file uploaded' });
    }
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API to delete a product by ID
app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    // Validate if productId is a valid ObjectId
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    const result = await db.collection('products').deleteOne({ _id: ObjectId(productId) });

    if (result.deletedCount === 1) {
      // Product deleted successfully
      res.json({ success: true, message: 'Product deleted successfully' });
    } else {
      // Product with the specified ID not found
      res.status(404).json({ success: false, error: 'Product not found' });
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


app.get('/', (req, res) => {
  // Retrieve image data from MongoDB (replace this with your own MongoDB logic)
  const imageData = retrieveImageDataFromMongoDB();

  // Render the HTML page and pass image data
  res.render('welcome', { imageData });
});

// Create a register page (GET request)
app.get('/register', (req, res) => {
	res.sendFile('register.html', { root: 'public' });
});

app.get('/login', (req, res) => {
  // Handle the login page route
  res.sendFile('login.html', { root: 'public' });
});

app.get('/profile', (req, res) => {
  // Your logic to fetch profile data, render a template, etc.
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Define the User schema
const userSchema = new mongoose.Schema({
  username_or_email: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

// Your hashPassword function
const hashPassword = async (password) => {
  // Generate a salt and hash the password
  const saltRounds = 10; // You can adjust this value based on your security requirements
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

// your login route
app.post('/api/login', async (req, res) => {
  const username = req.body.username;
        const password = req.body.password;

        console.log('Username:', username);
console.log('Password:', password);
        let client;
  try {
          // Connect to MongoDB
          const client = new MongoClient(process.env.MONGODB_URI);
  // Connect to MongoDBawait client.connect();
          await client.connect();

    // Access the users collection
    const collection = client.db().collection('user');

console.log('Successfully accessed the users collection');

    // Perform authentication logic against MongoDB
    const user = await collection.findOne( { username_or_email: username });

          console.log('Found user:', JSON.stringify(user));

if (user) {
      // Redirect to home page with user profile
      res.redirect('/profile.html'); // You can pass additional data in the URL or use sessions for more advanced scenarios
    } else {
      // If authentication fails, render the login page again with an error message
      res.redirect('/login.html')
    }

  } catch (error) {
        console.error('Error connecting to MongoDB:', error);
            res.render('login', { error: 'Internal Server Error' });
        res.status(500).send('Internal Server Error');
  } finally {
          if (client) {
    // Close the MongoDB connection
    await client.close();
  }
  }
});

// Handle registration form submission (POST request)
app.post('/api/register', async (req, res) => {
        console.log('Request body:', req.body);
  try {
    const { firstName, lastName, email, password, address, phoneNumber } = req.body;

    const db = getClient().db('p2ecommerce');
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered!' });
    }

    // Hash the password using bcrypt
const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      address,
      phoneNumber,
    };

    await usersCollection.insertOne(newUser);

    res.status(200).send('Registration successful!');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

        app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
	});
