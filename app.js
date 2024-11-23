const express = require("express");
const { MongoClient } = require("mongodb");
const morgan = require("morgan");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors()); 

const mongoURI = "mongodb+srv://Stutirai:stutirai@webstorecluster.scncs.mongodb.net/Webstore?retryWrites=true&w=majority";
let db;

// Connect to MongoDB Atlas
MongoClient.connect(mongoURI)
  .then(client => {
    console.log("Connected to MongoDB Atlas!");
    db = client.db("Webstore"); // Specify the database you want to use

    // Start the server once connected to MongoDB
    app.listen(3000, function () {
      console.log("App started on port 3000");
    });
  })
  .catch(err => {
    console.error("Error connecting to MongoDB Atlas", err);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

// Middleware to log the request method and URL
app.use((req, res, next) => {
  console.log(`Received request with Http method ${req.method} and URL ${req.url}`);
  next();
});

// Define a route to fetch lessons from the MongoDB database
app.get("/Webstore/lessons", async (req, res) => {
  try {
    const lessonsCollection = db.collection("lessons"); // Access the lessons collection
    const lessons = await lessonsCollection.find().toArray(); // Fetch all lessons as an array
    res.json(lessons); // Send the lessons data as JSON response
  } catch (err) {
    console.error("Error fetching lessons from database", err);
    res.status(500).send("Internal Server Error");
  }
});

// Define a route to fetch orders from the MongoDB database
app.get("/Webstore/orders", async (req, res) => {
    try {
      const ordersCollection = db.collection("orders"); // Access the orders collection
      const orders = await ordersCollection.find().toArray(); // Fetch all lessons as an array
      res.json(orders); // Send the orders data as JSON response
    } catch (err) {
      console.error("Error fetching lessons from database", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // Route to create a new order (POST request)
app.post("/Webstore/orders", async (req, res) => {
    try {
      const { name, phone, lessonIds, spaces } = req.body; // Get order details from the request body
      const newOrder = {
        name,
        phone,
        lessonIds,
        spaces,
      };
  
      // Insert the new order into the orders collection
      const ordersCollection = db.collection("orders");
      const result = await ordersCollection.insertOne(newOrder);
      
      // Respond with the newly created order
      res.status(201).json(result.ops[0]); // Return the created order
    } catch (err) {
      console.error("Error creating new order", err);
      res.status(500).send("Internal Server Error");
    }
  });


// Optional: Error handling middleware (catch all errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});
