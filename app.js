const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path"); // Add this to use path module
const propertiesReader = require("properties-reader"); // To read properties file

const app = express();
app.use(express.json());
app.use(cors());

// Load the properties from the db.properties file
let propertiesPath = path.resolve(__dirname, "config/db.properties");
let properties = propertiesReader(propertiesPath);

// Retrieve the properties
let dbPrefix = properties.get("db.prefix");
let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");

// Construct the MongoDB URI
const mongoURI = `${dbPrefix}${dbUsername}:${dbPwd}${dbUrl}${dbName}${dbParams ? `?${dbParams}` : ''}`;

let db;

//Connect to MongoDB Atlas
MongoClient.connect(mongoURI, {
    serverApi: { version: ServerApiVersion.v1 }
  })
    .then(client => {
      console.log("Connected to MongoDB Atlas!");
      db = client.db(dbName); // Specify the database you want to use
  
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
    const orders = await ordersCollection.find().toArray(); // Fetch all orders as an array
    res.json(orders); // Send the orders data as JSON response
  } catch (err) {
    console.error("Error fetching orders from database", err);
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
    res.status(201).json({ id: result.insertedId, ...newOrder }); // Return the created order and its id
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
