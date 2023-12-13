const express = require('express');
const multer = require('multer');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = 3000;

// MongoDB connection string with 'p2ecommerce' database
const mongoURI = 'mongodb://localhost:27017/p2ecommerce';
// Database name
const dbName = 'p2ecommerce';

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
app.get('/api/products', async (req, res) => {
  const products = await db.collection('products').find().toArray();

  // Prepend 'image/' to image filenames
  const productsWithImagePath = products.map(product => ({
    ...product,
    image: `image/${product.image}`,
  }));

  res.json(productsWithImagePath);
});

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

// Start the MongoDB connection
connectToMongoDB().then(() => {
  // Start the Express server after connecting to MongoDB
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
