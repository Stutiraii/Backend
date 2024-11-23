const express = require("express");
const { MongoClient } = require("mongodb");
const morgan = require("morgan");
const cors = require ("cors");

const app = express();
app.use(express.json());
app.use(cors()); 

const mongoURI = "mongodb+srv://Stutirai:stutirai@webstorecluster.scncs.mongodb.net/";
let db;


// Connect to MongoDB Atlas
MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    console.log("Connected to MongoDB Atlas!");
    db = client.db("Webstore"); // Specify the database you want to use
  })
  .catch(err => {
    console.error("Error connecting to MongoDB Atlas", err);
  });

// Middleware to log the request method and URL
app.use((req, res, next) => {
  console.log(`Received request with Http method ${req.method} and URL ${req.url}`);
  next();
});

// Start server on port 3000
app.listen(3000, function () {
  console.log("App started on port 3000");
});
