const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const propertiesReader = require("properties-reader");

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
const uri = dbPrefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

// Create MongoDB client instance
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db;

// Middleware to handle collection name
app.param("collectionName", function (req, res, next, collectionName) {
  req.collection = db.collection(collectionName);
  next();
});

// Middleware to validate request body
const validatePayload = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send({ msg: "Invalid payload" });
  }
  next();
};

// Routes
app.get("/collections/:collectionName", function (req, res, next) {
  req.collection.find({}).toArray(function (err, results) {
    if (err) return next(err);
    res.send(results);
  });
});

app.get("/collections/:collectionName/:id", function (req, res, next) {
  req.collection.findOne({ _id: new ObjectId(req.params.id) }, function (err, results) {
    if (err) return next(err);
    res.send(results);
  });
});

app.post("/collections/:collectionName", validatePayload, function (req, res, next) {
  req.collection.insertOne(req.body, function (err, results) {
    if (err) return next(err);
    res.send(results);
  });
});

app.put("/collections/:collectionName/:id", validatePayload, function (req, res, next) {
  req.collection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body },
    { safe: true, multi: false },
    function (err, result) {
      if (err) return next(err);
      res.send(result.matchedCount === 1 ? { msg: "success" } : { msg: "error" });
    }
  );
});

app.delete("/collections/:collectionName/:id", function (req, res, next) {
  req.collection.deleteOne({ _id: new ObjectId(req.params.id) }, function (err, result) {
    if (err) return next(err);
    res.send(result.deletedCount === 1 ? { msg: "success" } : { msg: "error" });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

// Connect to MongoDB Atlas and start server
client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB Atlas!");
    db = client.db(dbName);
    app.listen(3000, () => console.log("App started on port 3000"));
  })
  .catch(err => {
    console.error("Error connecting to MongoDB Atlas", err);
    process.exit(1);
  });
