// Import required modules
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const propertiesReader = require("properties-reader");
const morgan = require("morgan");

// Initialize Express app
const app = express();

// Middleware setup
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS for all origins
app.use(morgan("short")); // Log HTTP requests

// Load database properties
let propertiesPath = path.resolve(__dirname, "config/db.properties");
let properties = propertiesReader(propertiesPath);

// Extract database configuration details from properties file
let dbPprefix = properties.get("db.prefix");
let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");

// Construct MongoDB URI
const uri = `${dbPprefix}${dbUsername}:${dbPwd}${dbUrl}${dbParams}`;

// Create MongoDB client instance
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);

// Connect to MongoDB Atlas
client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB Atlas!");

    // Start Express server after successful DB connection
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
    process.exit(1); // Exit process if unable to connect to MongoDB
  });

// Middleware for handling dynamic collection names
app.param("collectionName", (req, res, next, collectionName) => {
  req.collection = db.collection(collectionName); // Bind the requested collection to the request object
  next();
});

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the backend API!");
});

// GET all documents from a collection
app.get("/collections/:collectionName", (req, res, next) => {
  req.collection.find({}).toArray((err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return next(err); // Pass error to error-handling middleware
    }
    res.send(results); // Send the results as the response
  });
});

// GET a single document by ID from a collection
app.get("/collections/:collectionName/:id", (req, res, next) => {
  req.collection.findOne({ _id: new ObjectId(req.params.id) }, (err, result) => {
    if (err) {
      return next(err);
    }
    res.send(result); // Send the found document
  });
});

// GET Route to handle search requests
app.get('/search', async (req, res) => {
  const { query } = req.query;
  const queryAsInt = parseInt(query, 10);

  try {
      const filter = {};

      if (query) {
          filter.$or = [
              { subject: { $regex: query, $options: 'i' } },
              { location: { $regex: query, $options: 'i' } },
              { price: queryAsInt },
              { availability: queryAsInt }
          ];
      }
      const lesson = await db.collection('lessons').find(filter).toArray();
      res.json(lesson);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

// POST: Add a new document to a collection
app.post("/collections/:collectionName", (req, res, next) => {
  req.collection.insertOne(req.body, (err, results) => {
    if (err) {
      return next(err);
    }
    res.send(results); // Respond with the inserted document details
  });
});

// PUT: Update an existing document by ID
app.put("/collections/:collectionName/:id", (req, res, next) => {
  req.collection.updateOne(
    { _id: new ObjectId(req.params.id) }, // Match the document by ID
    { $set: req.body }, // Update with new data
    { safe: true, multi: false }, // Update options
    (err, result) => {
      if (err) {
        return next(err);
      }
      res.send(result.matchedCount === 1 ? { msg: "success" } : { msg: "error" }); // Response based on match count
    }
  );
});

// DELETE: Remove a document by ID
app.delete("/collections/:collectionName/:id", (req, res, next) => {
  req.collection.deleteOne({ _id: new ObjectId(req.params.id) }, (err, result) => {
    if (err) {
      return next(err);
    }
    res.send(result.deletedCount === 1 ? { msg: "success" } : { msg: "error" }); // Response based on delete count
  });
});

// Serve static files from the "static" directory
const staticPath = path.join(__dirname, "static");
app.use("/static", express.static(staticPath, {
  fallthrough: true, // Passes request to next middleware if file not found
}));

// 404 middleware for unmatched routes
app.use((req, res) => {
  res.status(404).send("File not found"); // Respond with 404 error for unmatched routes
});

// General error-handling middleware
app.use((err, req, res, next) => {
  res.status(500).send({ msg: "Internal Server Error", error: err.message }); // Send generic error response
});
