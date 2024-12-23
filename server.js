require("dotenv").config();

const express = require("express");
const app = express();
const port = 3000;

app.use(express.static("public"));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.get("/api-key", (req, res) => {
  res.send(process.env.ARCGIS_API_KEY);
});
