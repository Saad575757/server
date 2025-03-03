require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

const app = express();

// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceaccount.json"); // Replace with your service account key path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore(); // Initialize Firestore

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create the 'uploads' directory if it doesn't exist
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }
    cb(null, "uploads/"); // Save files in the 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Append a timestamp to the filename to make it unique
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Route to handle file uploads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/upload", async (req, res) => { // Make async
  try {
    // console.log("Files uploaded:", req.files);
    const leadId = req.body.leadId;
    console.log("Lead ID:", leadId);

    // Prepare data to be stored in Firestore
    const uploadData = {
      leadId: leadId,
      // files: req.files.map(file => ({ //commented out file section
      //   filename: file.filename,
      //   originalname: file.originalname,
      //   path: file.path,
      //   size: file.size,
      //   mimetype: file.mimetype,
      //   // Add other relevant file metadata
      // })),
      timestamp: admin.firestore.FieldValue.serverTimestamp(), // Add a timestamp
      // Add other relevant data you want to store
    };

    // Store data in Firestore
    await db.collection("upload").add(uploadData); // Use await here

    res.status(200).json({
      message: "Lead ID stored successfully",
      leadId: leadId,
    });
  } catch (error) {
    console.error("Error storing lead ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

// Export the app for Vercel
module.exports = app;