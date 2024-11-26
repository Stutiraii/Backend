const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const path = require("path");
const propertiesReader = require("properties-reader");
const morgan = require("morgan");

const app = express();

// Middleware for parsing JSON
app.use(express.json());
// Enable CORS for all origins
app.use(cors());
// Enable HTTP request logging
app.use(morgan("short"));

// Load the properties from the db.properties file
let propertiesPath = path.resolve(__dirname, "config/db.properties");
let properties = propertiesReader(propertiesPath);

// Retrieve the properties
let dbPprefix = properties.get("db.prefix");
let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");

// Construct the MongoDB URI
const uri = dbPprefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

// Create MongoDB client instance
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db =  client.db(dbName);

// Connect to MongoDB Atlas
client.connect()
  .then(() => {
    console.log("Connected to MongoDB Atlas!");
    
    // Start the server only after successful connection to MongoDB
    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch(err => {
    console.error("Error connecting to MongoDB Atlas", err);
    process.exit(1); // Exit if unable to connect to MongoDB
  });

// Middleware to handle collection name dynamically
app.param("collectionName", function (req, res, next, collectionName) {
  req.collection = db.collection(collectionName);
  next();
});

// Routes

// GET all documents in the specified collection
app.get("/collections/:collectionName", function (req, res, next) {
  console.log("Fetching data from collection:", req.params.collectionName);
  req.collection.find({}).toArray(function (err, results) {
    if (err) {
      console.error("Error fetching data:", err);
      return next(err);
    }
    console.log("Results:", results);
    res.send(results);
  });
});


app.get('/collections/:collectionName/:id'
  , function(req, res, next) {
   req.collection.findOne({ _id: new ObjectId(req.params.id) }, function(err, results) {
   if (err) {
   return next(err);
   }
   res.send(results);
   });
  });


// POST a new document to the specified collection
app.post("/collections/:collectionName", function (req, res, next) {
  console.log("Inserting new document into collection:", req.params.collectionName);
  req.collection.insertOne(req.body, function (err, result) {
    if (err) {
      console.error("Error inserting document:", err);
      return next(err);
    }
    res.send(result);
  });
});

// PUT (update) an existing document by ID in the specified collection
app.put("/collections/:collectionName/:id", function (req, res, next) {
  console.log("Updating document with ID:", req.params.id);
  req.collection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body },
    { safe: true, multi: false },
    function (err, result) {
      if (err) {
        console.error("Error updating document:", err);
        return next(err);
      }
      res.send(result.matchedCount === 1 ? { msg: "success" } : { msg: "error" });
    }
  );
});

// DELETE a document by ID from the specified collection
app.delete("/collections/:collectionName/:id", function (req, res, next) {
  console.log("Deleting document with ID:", req.params.id);
  req.collection.deleteOne({ _id: new ObjectId(req.params.id) }, function (err, result) {
    if (err) {
      console.error("Error deleting document:", err);
      return next(err);
    }
    res.send(result.deletedCount === 1 ? { msg: "success" } : { msg: "error" });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error details:", err);
  res.status(500).send({ msg: "Internal Server Error", error: err.message });
});
