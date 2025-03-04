require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();

try {
  const serviceAccount = require("./serviceaccount.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();

  app.use(express.json());
  app.use(cors({
    origin: [
      'https://localhost:3003',
      'https://react-project-theta-sandy-50.vercel.app',
      'https://cool-concha-77afd3.netlify.app'
    ],
  }));

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

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

//   app.post("/api/upload", async (req, res) => {
//     try {
//         const leadId = req.body.lead_id; // Access leadId from req.body

//         if (!leadId) {
//             return res.status(400).json({ error: "Lead ID is required" });
//         }

//         const uploadData = {
//             leadId: leadId,
//             timestamp: admin.firestore.FieldValue.serverTimestamp(),
//         };

//         await db.collection("upload").add(uploadData); // Add to the "upload" collection directly

//         res.status(200).json({
//             message: "Lead ID stored successfully",
//             leadId: leadId,
//         });
//     } catch (error) {
//         console.error("Error storing lead ID:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });

  app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Something went wrong!" });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
  });

  module.exports = app;
} catch (initializationError) {
    console.error("Server Initialization Error:", initializationError);
    // Handle initial server setup errors, such as Firebase initialization failure.
    // you might want to log this to a more persistent logging service.
    // If the server cannot initialize, you might want to exit the process.
    // process.exit(1);
    // Alternatively, you can send a basic error message.
    app.use((req, res, next) => {
      res.status(500).send("Server Initialization Failed");
    });
}