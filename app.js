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

// Optional: Error handling middleware (catch all errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});
