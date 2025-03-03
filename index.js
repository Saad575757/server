require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(express.json());

// CORS configuration
app.use(cors({
  origin: [
    'https://localhost:3003',
    'https://react-project-theta-sandy-50.vercel.app',
    'https://cool-concha-77afd3.netlify.app' // Add this
  ],
}));

// Endpoint to get Salesforce access token
app.post("/auth/salesforce", async (req, res) => {
  try {
    const params = new URLSearchParams({
      grant_type: "password",
      client_id: process.env.SALESFORCE_CLIENT_ID,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET,
      username: process.env.SALESFORCE_USERNAME,
      password: process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN,
    });

    const response = await axios.post(
      "https://test.salesforce.com/services/oauth2/token",
      params
    );
    console.log("Salesforce Access Token:", response.data.access_token);
    res.json(response.data);
  } catch (error) {
    console.error("Error getting Salesforce access token:", error.response.data);
    res.status(400).json({ error: error.response.data });
  }
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Route to handle file uploads
app.post("/api/upload", upload.any(), (req, res) => {
  try {
    console.log("Files uploaded:", req.files);
    const leadId = req.body.leadId;
    console.log("Lead ID:", leadId);
    res.status(200).json({
      message: "Files uploaded successfully",
      files: req.files,
      leadId: leadId,
    });
  } catch (error) {
    console.error("Error handling file upload:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(5000, () => {
  console.log("🚀 Backend running on https://react-project-theta-sandy-50.vercel.app");
});