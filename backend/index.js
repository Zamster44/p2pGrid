require("dotenv").config();
const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilites");
const { ethers } = require("ethers");

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

// WebSocket server logic with corrected template literals
wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
    wsDataStore.push(message.toString());
    ws.send(`Echo: ${message} `);
  });
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Middleware for HTTP server
app.use(express.json());
app.use(cors({ origin: "*" }));

// Blockchain configuration
const blockchainConfig = {
  rpcUrl: "http://192.168.137.186:8545", // Replace with actual IP if needed
  contractAddress: "0x73511669fd4dE447feD18BB79bAFeAC93aB7F31f", // Your deployed contract address (update if needed)
  contractABI: [
    "function registerUser(string memory, uint256, uint256) public",
    "function tradeEnergy(address, uint256) public",
    "function getUserDetails(address) public view returns (string memory, uint256, uint256, uint256)",
    "function updateUserDetails(uint256, uint256) public",
    "event TradeCompleted(address indexed sender, address indexed receiver, uint256 totalCost, uint256 chargeTransferred)"
  ],
};

// Load Hardhat accounts from environment variable
const HARDHAT_ACCOUNTS = JSON.parse(process.env.HARDHAT_ACCOUNTS);
let availableAccounts = [...HARDHAT_ACCOUNTS];

// Middleware to assign a blockchain account
const assignBlockchainAccount = async (req, res, next) => {
  if (availableAccounts.length === 0) {
    return res.status(500).json({
      error: true,
      message: "No available blockchain accounts",
    });
  }
  req.assignedAccount = availableAccounts.pop();
  next();
};

// ----------------------
// HTTP Routes
// ----------------------

// Root route to display WebSocket data
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the server!",
    wsData: wsDataStore,
  });
});

// Route to fetch WebSocket data
app.get("/get-ws-data", (req, res) => {
  res.json({
    error: false,
    wsData: wsDataStore,
    message: "WebSocket data fetched successfully",
  });
});

// Create account route
app.post("/create-account", assignBlockchainAccount, async (req, res) => {
  const { fullName, email, password, seller } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: true, message: "Full Name, Email, and Password are required" });
  }

  // Check if user already exists
  const isUser = await User.findOne({ email });
  if (isUser) {
    return res.json({ error: true, message: "User already exists" });
  }

  // Create new user with assigned blockchain account
  const user = new User({
    fullName,
    email,
    password,
    seller,
    blockchainAddress: req.assignedAccount.account, // Corrected here
    privateKey: req.assignedAccount.privateKey, // And here
  });
  await user.save();

  // Interact with blockchain
  const provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
  const wallet = new ethers.Wallet(user.privateKey, provider);
  const contract = new ethers.Contract(blockchainConfig.contractAddress, blockchainConfig.contractABI, wallet);

  // Set default values for initial registration on-chain (could be updated later)
  const initialCharge = 50;
  const initialPrice = 0;

  try {
    const tx = await contract.registerUser(fullName, initialCharge, initialPrice);
    await tx.wait();
  } catch (error) {
    console.error("Blockchain registration error:", error);
    return res.status(500).json({ error: true, message: "Failed to register user on blockchain", details: error.message });
  }

  // Generate JWT token
  const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "36000m" });
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
  if (!email || !password) {
    return res.status(400).json({ error: true, message: "Email and Password are required" });
  }
  const userInfo = await User.findOne({ email });
  if (!userInfo) {
    return res.status(400).json({ error: true, message: "User does not exist" });
  }
  if (userInfo.email === email && userInfo.password === password) {
    const user = { user: userInfo };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "36000m" });
    return res.json({
      error: false,
      message: "Logged in successfully",
      email,
      fullName: userInfo.fullName,
      seller: userInfo.seller,
      accessToken,
    });
  } else {
    return res.status(400).json({ error: true, message: "Invalid credentials" });
  }
});

// Add seller form route
app.post("/addSellerForm", authenticateToken, async (req, res) => {
  const { fullName, email, price, powerToBeTransForm, currentStateOfCharge, unitNo } = req.body;
  if (!fullName || !email || !price || !powerToBeTransForm || !currentStateOfCharge || !unitNo) {
    return res.status(400).json({ error: true, message: "All fields are required" });
  }

  try {
    const userInfo = await User.findOne({ email });
    if (!userInfo) {
      return res.status(404).json({ error: true, message: "User not found" });
    }
    userInfo.seller = true;
    await userInfo.save();

    // Update blockchain with seller details by updating user's on-chain details
    const provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
    const wallet = new ethers.Wallet(userInfo.privateKey, provider);
    const contract = new ethers.Contract(blockchainConfig.contractAddress, blockchainConfig.contractABI, wallet);
    const charge = parseInt(powerToBeTransForm);
    const priceValue = parseInt(price);
    try {
      const tx = await contract.updateUserDetails(charge, priceValue);
      await tx.wait();
    } catch (error) {
      console.error("Blockchain update error:", error);
      return res.status(500).json({ error: true, message: "Blockchain update failed", details: error.message });
    }

    const seller = new Seller({
      fullName,
      email,
      price,
      powerToBeTransForm,
      currentStateOfCharge,
      unitNo,
      blockchainAddress: userInfo.blockchainAddress
    });
    await seller.save();

    return res.json({ error: false, seller, message: "Seller added successfully" });
  } catch (error) {
    console.error("Seller registration error:", error);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

// Get sellers route
app.get("/getSellers", authenticateToken, async (req, res) => {
  try {
    const sellers = await Seller.find({});
    return res.json({ error: false, sellers, message: "Sellers fetched successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

// Get current user
app.get("/current-user", authenticateToken, async (req, res) => {
  try {
    const user = req.user.user;
    const userData = await User.findOne({ email: user.email });
    if (!userData) return res.status(404).json({ error: true, message: "User not found" });
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
    if (!seller) return res.status(404).json({ error: true, message: "Seller not found" });
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
      { fullName, price, powerToBeTransForm, currentStateOfCharge, unitNo },
      { new: true, runValidators: true }
    );
    if (!updatedSeller) {
      return res.status(404).json({ error: true, message: "Seller not found" });
    }
    return res.json({ error: false, seller: updatedSeller, message: "Seller updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

// Trade route using blockchain interaction
app.post("/trade", authenticateToken, async (req, res) => {
  try {
    const { sellerEmail, amount } = req.body;
    const buyerEmail = req.user.user.email;

    // Get buyer details
    const buyer = await User.findOne({ email: buyerEmail });
    if (!buyer) return res.status(404).json({ error: true, message: "Buyer not found" });

    // Get seller details
    const seller = await Seller.findOne({ email: sellerEmail });
    if (!seller) return res.status(404).json({ error: true, message: "Seller not found" });

    // Check that seller blockchain address exists
    if (!seller.blockchainAddress) {
      return res.status(400).json({ error: true, message: "Seller's blockchain address not found" });
    }

    // Connect to blockchain node
    const provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
    const wallet = new ethers.Wallet(buyer.privateKey, provider);
    const contract = new ethers.Contract(blockchainConfig.contractAddress, blockchainConfig.contractABI, wallet);

    // Execute trade on blockchain
    const tx = await contract.tradeEnergy(seller.blockchainAddress, amount);
    const receipt = await tx.wait();

    res.json({
      error: false,
      message: "Trade successful",
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Trade error:", error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Admin routes for account monitoring and resetting
app.get("/admin/accounts", authenticateToken, (req, res) => {
  res.json({
    total: HARDHAT_ACCOUNTS.length,
    available: availableAccounts.length,
    used: HARDHAT_ACCOUNTS.length - availableAccounts.length,
  });
});

app.post("/admin/reset-accounts", authenticateToken, (req, res) => {
  availableAccounts = [...HARDHAT_ACCOUNTS];
  res.json({ message: "Account pool reset" });
});

// -------------------------
// Contract Event Listener
// -------------------------

// Create a read-only contract instance for event listening
const eventProvider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
const eventContract = new ethers.Contract(
  blockchainConfig.contractAddress,
  blockchainConfig.contractABI,
  eventProvider
);

// Listen for TradeCompleted events
eventContract.on("TradeCompleted", (sender, receiver, totalCost, chargeTransferred, event) => {
  console.log("Trade Completed!");
  console.log("Sender:", sender);
  console.log("Receiver:", receiver);
  console.log("Total Cost:", totalCost.toString());
  console.log("Charge Transferred:", chargeTransferred.toString());
  
  // Fetch and log updated details for sender and receiver
  updateBalances(sender);
  updateBalances(receiver);
});

async function updateBalances(userAddress) {
  try {
    const details = await eventContract.getUserDetails(userAddress);
    console.log(`Updated details for ${userAddress}: `, details);
  } catch (err) {
    console.error("Error fetching updated details for", userAddress, ":", err.message);
  }
}

// -------------------------
// Start HTTP and WebSocket Servers on port 8000
// -------------------------
server.listen(8000, () => {
  console.log("HTTP and WebSocket servers are running on ws://localhost:8000");
});

module.exports = app;