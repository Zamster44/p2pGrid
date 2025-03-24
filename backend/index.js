require("dotenv").config();
const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilites");

// Load configuration and models
const config = require("./config.json");
const User = require("./models/user.model");
const Seller = require("./models/seller.model");

// Connect to MongoDB
mongoose.connect(config.connectionString);

// Create an Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create a WebSocket server by passing the HTTP server
const wss = new WebSocket.Server({ server });

// In-memory storage for WebSocket messages
const wsDataStore = [];

// WebSocket server logic
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Handle incoming messages from WebSocket clients
  ws.on('message', (message) => {
    console.log(`Received: ${message}`);

    // Store the message in the in-memory data store
    wsDataStore.push(message.toString());

    // Echo the message back to the client
    ws.send(`Echo: ${message}`);
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Middleware for HTTP server
app.use(express.json()); // Parse JSON bodies
app.use(cors({ origin: "*" })); // Enable CORS for all origins

// HTTP Routes

// Root route to display WebSocket data
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the server!",
    wsData: wsDataStore, // Send the stored WebSocket data
  });
});

// Route to fetch WebSocket data
app.get("/get-ws-data", (req, res) => {
  res.json({
    error: false,
    wsData: wsDataStore, // Send the stored WebSocket data
    message: "WebSocket data fetched successfully",
  });
});

// Create account route
app.post("/create-account", async (req, res) => {
  const { fullName, email, password, seller } = req.body;

  // Validate input
  if (!fullName) {
    return res.status(400).json({ error: true, message: "Full Name is required" });
  }
  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }
  if (!password) {
    return res.status(400).json({ error: true, message: "Password is required" });
  }

  // Check if user already exists
  const isUser = await User.findOne({ email: email });
  if (isUser) {
    return res.json({ error: true, message: "User already exists" });
  }

  // Create new user
  const user = new User({ fullName, email, password, seller });
  await user.save();

  // Generate JWT token
  const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "36000m",
  });

  // Return success response
  return res.json({
    error: false,
    user,
    accessToken,
    message: "Registration Successful",
  });
});

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }
  if (!password) {
    return res.status(400).json({ error: true, message: "Password is required" });
  }

  // Find user in the database
  const userInfo = await User.findOne({ email: email });
  if (!userInfo) {
    return res.status(400).json({ error: true, message: "User does not exist" });
  }

  // Validate credentials
  if (userInfo.email === email && userInfo.password === password) {
    const user = { user: userInfo };
    const fullName = userInfo.fullName;
    const seller = userInfo.seller;

    // Generate JWT token
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "36000m",
    });

    // Return success response
    return res.json({
      error: false,
      message: "Logged in successfully",
      email,
      fullName,
      seller,
      accessToken,
    });
  } else {
    return res.status(400).json({ error: true, message: "Invalid credentials" });
  }
});

// Add seller form route
app.post("/addSellerForm", authenticateToken, async (req, res) => {
  const { fullName, email, price, powerToBeTransForm, currentStateOfCharge, unitNo } = req.body;

  // Validate input
  if (!fullName) {
    return res.status(400).json({ error: true, message: "FullName is required" });
  }
  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }
  if (!price) {
    return res.status(400).json({ error: true, message: "Price is required" });
  }
  if (!powerToBeTransForm) {
    return res.status(400).json({ error: true, message: "Power To Be TransForm is required" });
  }
  if (!currentStateOfCharge) {
    return res.status(400).json({ error: true, message: "Current State Of Charge is required" });
  }
  if (!unitNo) {
    return res.status(400).json({ error: true, message: "Unit Number is required" });
  }

  try {
    // Find user in the database
    const userInfo = await User.findOne({ email: email });
    if (!userInfo) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    // Update user as a seller
    userInfo.seller = true;
    await userInfo.save();

    // Create new seller
    const seller = new Seller({
      fullName,
      email,
      price,
      powerToBeTransForm,
      currentStateOfCharge,
      unitNo,
    });
    await seller.save();

    // Return success response
    return res.json({
      error: false,
      seller,
      message: "Seller added successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

// Get sellers route
app.get("/getSellers", authenticateToken, async (req, res) => {
  try {
    // Fetch all sellers from the database
    const sellers = await Seller.find({});

    // Return the list of sellers
    return res.json({
      error: false,
      sellers,
      message: "Sellers fetched successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
});

// Get current user
app.get("/current-user", authenticateToken, async (req, res) => {
  try {
    const user = req.user.user; // From JWT
    const userData = await User.findOne({ email: user.email });
    if (!userData) {
      return res.status(404).json({ error: true, message: "User not found" });
    }
    return res.json({ error: false, user: userData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

// Get seller by email
app.get("/seller-by-email/:email", authenticateToken, async (req, res) => {
  try {
    const seller = await Seller.findOne({ email: req.params.email });
    if (!seller) {
      return res.status(404).json({ error: true, message: "Seller not found" });
    }
    return res.json({ error: false, seller });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

// Update seller by email
app.put("/update-seller/:email", authenticateToken, async (req, res) => {
  try {
    const { fullName, price, powerToBeTransForm, currentStateOfCharge, unitNo } = req.body;

    const updatedSeller = await Seller.findOneAndUpdate(
      { email: req.params.email },
      {
        fullName,
        price,
        powerToBeTransForm,
        currentStateOfCharge,
        unitNo,
      },
      { new: true, runValidators: true }
    );

    if (!updatedSeller) {
      return res.status(404).json({ error: true, message: "Seller not found" });
    }

    return res.json({
      error: false,
      seller: updatedSeller,
      message: "Seller updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

// Start the server on port 8000
server.listen(8000, () => {
  console.log('HTTP and WebSocket servers are running on ws://localhost:8000');
});

module.exports = app;