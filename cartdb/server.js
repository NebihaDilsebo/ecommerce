const express = require('express');
const multer = require('multer');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const mongoURI = 'mongodb://localhost:27017';
const dbName = 'p2ecommerce';
const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

// Connect to MongoDB
client.connect()
  .then(() => {
    console.log('Connected to the database');
    db = client.db(dbName);
  })
  .catch(err => console.error('Error connecting to the database:', err));

// Serve static files, including images, from the public directory
app.use(express.static('public'));

// Serve images from the 'images' directory
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Define a product schema
const productCollection = 'products';

// Define a route to fetch products
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.collection(productCollection).find().toArray();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
