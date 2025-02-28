require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();
app.use(express.json());
app.use(cors());

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
// Set up Multer for file uploads
// Set up Multer for file uploads
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

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to handle file uploads
app.post("/api/upload", upload.any(), (req, res) => {
  try {
    console.log("Files uploaded:", req.files);

    // Extract leadId from the request body
    const leadId = req.body.leadId;
    console.log("Lead ID:", leadId);

    // Respond with success message, uploaded file details, and leadId
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Something went wrong!" });
});
// Endpoint to convert Lead to Opportunity
// app.post("/convert-lead", async (req, res) => {
//   const {
//     leadId,
//     accessToken,
//     instanceUrl,
//     StageName,
//     opportunityName,
//     doNotCreateOpportunity,
//     accountId,
//     // contactId,
//   } = req.body;

//   try {
//     // Log the payload for debugging
//     console.log("Payload received for Lead conversion:", {
//       leadId,
//       accessToken,
//       instanceUrl,
//       StageName	,
//       opportunityName,
//       doNotCreateOpportunity,
//       accountId,
//       // contactId,
//     });

//     // Log the access token and instance URL
//     console.log("Access Token:", accessToken);
//     console.log("Instance URL:", instanceUrl);

//     const response = await axios.post(
//       `${instanceUrl}/services/data/v59.0/sobjects/Lead/${leadId}/convert`,
//       {
//         StageName, // Required
//         opportunityName, // Optional
//         doNotCreateOpportunity, // Optional
//         accountId, // Optional
//         // contactId, // Optional
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     res.json(response.data);
//   } catch (error) {
//     console.error("Error converting Lead:", error.response ? error.response.data : error.message);
//     res.status(400).json({ error: error.response ? error.response.data : error.message });
//   }
// });
app.post("/convert-lead", async (req, res) => {
  const { leadId, accessToken, instanceUrl, StageName, opportunityName, doNotCreateOpportunity, accountId, contactId } = req.body;
console.log(accessToken)
  try {
      // Change the lead status to a convertible status
      const patchUrl = `${instanceUrl}/services/data/v63.0/sobjects/Lead/${leadId}`;
      console.log("Instance URL (patch):", patchUrl);


      await axios.patch(
        patchUrl,

          {
              Status: "Working - Contacted", // or another valid convertible status
          },
          {
              headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
              },
          }
      );

      // Now, convert the lead
      const postUrl = `${instanceUrl}/services/data/v63.0/sobjects/Lead/${leadId}/convert`;
      console.log("Instance URL (post):", postUrl);

      const response = await axios.post(
        postUrl,       {
              convertedStatus: StageName, //Use the stagename as the converted status.
              opportunityName,
              doNotCreateOpportunity,
              accountId,
              contactId,
          },
          {
              headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
              },
          }
      );

      res.json(response.data);
  } catch (error) {
      
    console.error("Error converting Lead:", error.response ? error.response.data : error.message);
      res.status(400).json({ error: error.response ? error.response.data : error.message });
  }
});
app.post("/test-convert", async (req, res) => {
  try {
      // Replace with your actual values
   
      const leadId = "00QAu00000OcdnJMAR";
      const accessToken = "00DAu0000034x1N!AQEAQMKz3obN.Fb2bCavtqwTVx_gPPB6dWJ1aoGHxEzq.vsjvZjh6eMvLT3ELYpeV0sCzGvyZWLAOWNEUdUHScOmKReh_BpS";
      const instanceUrl = "https://erptechnicals--fulrdpbx.sandbox.my.salesforce.com";
      const convertedStatus = "Qualification"; // Or a valid status in your org

      const convertLeadResponse = await axios.post(
          "http://localhost:5000/convert-lead", // Assuming your server runs on port 5000
          {
              leadId,
              accessToken,
              instanceUrl,
              convertedStatus,
              opportunityName: "Test Opportunity", // Optional
              doNotCreateOpportunity: false, // Optional
              accountId: null, // Optional
              contactId: null, // Optional
          }
      );

      res.json(convertLeadResponse.data);
  } catch (error) {
      console.error("Error calling convert-lead endpoint:", error.response ? error.response.data : error.message);
      res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
});

// Start the server
app.listen(5000, () => {
  console.log("🚀 Backend running on http://localhost:5000");
});