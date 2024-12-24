// Description: This file is the entry point for the server. It serves the static files in the public folder and provides the API key to the client.

// The dotenv package is used to load the environment variables from the .env file.
require("dotenv").config();

// Import the express library
const express = require("express");
// Create an express application
const app = express();
// Set the port to 3000
const port = 3000;

// Serve the static files in the public folder
app.use(express.static("public"));

// Start the server on port 3000
app.listen(port, () => {
  // Log a message to the console
  console.log(`Server running at http://localhost:${port}`);
});

// Create an API endpoint to provide the ArcGIS API key
app.get("/api-key", (req, res) => {
  // Send the API key to the client
  res.send(process.env.ARCGIS_API_KEY);
});
