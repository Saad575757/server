require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'https://localhost:3003',
    'https://react-project-theta-sandy-50.vercel.app',
    'https://cool-concha-77afd3.netlify.app'
  ],
}));

// Salesforce Authentication Endpoint
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
    console.error("Error getting Salesforce access token:", error.response?.data || error.message);
    res.status(400).json({ error: error.response?.data || error.message });
  }
});

// Multer Setup for File Uploads
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

// File Upload Endpoint
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

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

// Export the app for Vercel
module.exports = app;