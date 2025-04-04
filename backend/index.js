require("dotenv").config();
const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilites");
const { ethers } = require("ethers");

const colors = require("colors");
colors.enable();

// Load configuration and models
const config = require("./config.json");
const User = require("./models/user.model");
const Seller = require("./models/seller.model");
const TransferLog = require("./models/transfer.model");

// Connect to MongoDB
mongoose.connect(config.connectionString);

// Create an Express app and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Create a WebSocket server by passing the HTTP server
const espConnections = new Map(); // Map<espId, WebSocket>
const activeTransfers = new Map();

// Enhanced WebSocket logging
wss.on("connection", (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`🌐 New Connection from: ${clientIp}`.cyan);

  ws.on("message", async (message) => {
    try {
      const rawMessage = message.toString();
      console.log(`📥 Raw Message: ${rawMessage}`.dim);

      const data = JSON.parse(rawMessage);
      console.log("📦 Parsed Message:".blue, JSON.stringify(data, null, 2));

      // Handle warnings first
      if (data.warning) {
        console.log(
          `⚠ ESP Warning from ${data.device_id || "unknown"}: ${data.warning}`
            .yellow
        );
        return;
      }

      // Device registration
      if (
        data.device_id &&
        data.message === "REGISTER" &&
        !espConnections.get(data.device_id)
      ) {
        handleRegistration(ws, data.device_id);
        return;
      }

      // Energy data handling
      if (data.device_id && typeof data.energy !== "undefined") {
        await handleEnergyData(data.device_id, data);
        return;
      }

      console.log("⚠ Unhandled Message Type:".yellow, JSON.stringify(data));
    } catch (error) {
      console.error("💣 Message Error:".red, error.message);
      console.error("💣 Original Message:".red, message.toString());
    }
  });

  ws.on("close", () => {
    console.log(`🔌 Connection Closed: ${clientIp}`.red);
    cleanupConnections(ws);
  });

  ws.on("error", (error) => {
    console.error("💥 WebSocket Error:".red, error.message);
  });
});

// Improved registration handler
function handleRegistration(ws, deviceId) {
  console.log(`🆔 Registration Attempt: ${deviceId}`.magenta);

  if (espConnections.has(deviceId)) {
    console.log(`⚠ Already Registered: ${deviceId}`.yellow);
    ws.send(
      JSON.stringify({
        error: true,
        message: "Device already registered",
      })
    );
    return;
  }

  espConnections.set(deviceId, ws);
  console.log(`✅ Registered Device: ${deviceId}`.green.bold);
  ws.send(
    JSON.stringify({
      status: "REGISTERED",
      device_id: deviceId,
    })
  );
}

// Enhanced energy data processing
async function handleEnergyData(deviceId, data) {
  console.log(
    `⚡ Update from ${deviceId}: 
    Power: ${data.power}mW, 
    Voltage: ${data.voltage}V, 
    Energy: ${data.energy}Wh`.cyan
  );

  if (!activeTransfers.has(deviceId)) {
    console.log(`❌ No active transfer for ${deviceId}`.red);
    return;
  }

  const transfer = activeTransfers.get(deviceId);

  transfer.accumulated = data.energy;

  console.log(
    `📊 Progress: ${transfer.accumulated.toFixed(4)}/${transfer.target}Wh`
      .yellow
  );

  if (transfer.accumulated >= transfer.target) {
    console.log(`🎯 Target Reached for ${deviceId}`.green.bold);
    await finalizeTransfer(deviceId, transfer);
  }
}

// Finalize transfer with safety
async function finalizeTransfer(deviceId, transfer) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Send stop command to ESP
    const ws = espConnections.get(deviceId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          device_id: deviceId,
          message: "STOP_TRANSFER",
        })
      );
      console.log(`🛑 Sent STOP command to ${deviceId}`.yellow);
    }

    // Database updates
    await Seller.updateOne(
      { device_id: deviceId },
      { $inc: { energyQuota: -transfer.accumulated } },
      { session }
    );

    await TransferLog.create(
      [
        {
          espId: deviceId,
          amount: transfer.accumulated,
          transactionHash: transfer.transactionHash,
          status: "COMPLETED",
          duration: Date.now() - transfer.startTime,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    console.log(`💰 Transfer ${deviceId} completed!`.green.bold);
  } catch (error) {
    await session.abortTransaction();
    console.error("💣 Transfer Failed:".red, error.message);
  } finally {
    session.endSession();
    clearTimeout(transfer.timeout);
    activeTransfers.delete(deviceId);
  }
}

// Middleware for HTTP server
app.use(express.json());
app.use(cors({ origin: "*" }));

// Blockchain configuration
const blockchainConfig = {
  rpcUrl: "http://192.168.231.210:8545", // Replace with actual IP if needed
  contractAddress: "0xC92B72ecf468D2642992b195bea99F9B9BB4A838", // Your deployed contract address (update if needed)
  contractABI: [
    "function registerUser(string memory, uint256, uint256) public",
    "function tradeEnergy(address, uint256, uint256) public",
    "function getUserDetails(address) public view returns (string memory, uint256, uint256, uint256)",
    "function updateUserDetails(uint256, uint256) public",
    "event UserRegistered(string memory, uint256 charge, uint256 pricePerUnit)",
    "event UserAlreadyRegistered(address indexed user, string name)",
    "event TradeCompleted(address indexed sender, address indexed receiver, uint256 totalCost, uint256 chargeTransferred, uint256 stateOfCharge)"
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
// 2. Network Testing Endpoint
app.get("/network-test", (req, res) => {
  console.log("🔍 Network Test Request from:", req.ip);
  res.json({
    serverTime: new Date().toISOString(),
    websocketPort: config.wsPort,
    connectedDevices: espConnections.size,
  });
});

// 3. Add WebSocket message echo endpoint
app.post("/ws-echo", express.json(), (req, res) => {
  const { deviceId, message } = req.body;
  const ws = espConnections.get(deviceId);

  if (!ws) {
    console.log(`❌ Device ${deviceId} not connected`.red);
    return res.status(404).json({ error: "Device not connected" });
  }

  ws.send(JSON.stringify(message));
  res.json({ status: "Message sent" });
});

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the server!",
  });
});

// Create account route
app.post("/create-account", assignBlockchainAccount, async (req, res) => {
  const { fullName, email, password, seller, espId } = req.body;

  if (!fullName || !email || !password || !espId) {
    return res.status(400).json({
      error: true,
      message: "Full Name, Email,Id , and Password are required",
    });
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
    espId,
    blockchainAddress: req.assignedAccount.account, // Corrected here
    privateKey: req.assignedAccount.privateKey, // And here
    balance: 10000,
  });
  await user.save();

  // Interact with blockchain
  const provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
  const wallet = new ethers.Wallet(user.privateKey, provider);
  const contract = new ethers.Contract(
    blockchainConfig.contractAddress,
    blockchainConfig.contractABI,
    wallet
  );

  // Set default values for initial registration on-chain (could be updated later)
  const initialCharge = 0;
  const initialPrice = 0;

  try {
    const tx = await contract.registerUser(
      fullName,
      initialCharge,
      initialPrice
    );
    await tx.wait();
  } catch (error) {
    console.error("Blockchain registration error:", error);
    return res.status(500).json({
      error: true,
      message: "Failed to register user on blockchain",
      details: error.message,
    });
  }

  // Generate JWT token
  const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "36000m",
  });
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
    return res
      .status(400)
      .json({ error: true, message: "Email and Password are required" });
  }
  const userInfo = await User.findOne({ email });
  if (!userInfo) {
    return res
      .status(400)
      .json({ error: true, message: "User does not exist" });
  }
  if (userInfo.email === email && userInfo.password === password) {
    const user = { user: userInfo };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "36000m",
    });
    return res.json({
      error: false,
      message: "Logged in successfully",
      email,
      fullName: userInfo.fullName,
      seller: userInfo.seller,
      accessToken,
    });
  } else {
    return res
      .status(400)
      .json({ error: true, message: "Invalid credentials" });
  }
});

// Add seller form route
app.post("/addSellerForm", authenticateToken, async (req, res) => {
  const { fullName, email, price, espId, currentStateOfCharge, energyQuota } =
    req.body;
  if (
    !fullName ||
    !email ||
    !price ||
    !espId ||
    !currentStateOfCharge ||
    !energyQuota
  ) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
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
    const contract = new ethers.Contract(
      blockchainConfig.contractAddress,
      blockchainConfig.contractABI,
      wallet
    );
    const charge = parseInt(currentStateOfCharge);
    const priceValue = parseInt(price);
    try {
      const tx = await contract.updateUserDetails(charge, priceValue);
      await tx.wait();
    } catch (error) {
      console.error("Blockchain update error:", error);
      return res.status(500).json({
        error: true,
        message: "Blockchain update failed",
        details: error.message,
      });
    }

    const seller = new Seller({
      fullName,
      email,
      price,
      espId,
      currentStateOfCharge,
      energyQuota,
      blockchainAddress: userInfo.blockchainAddress,
    });
    await seller.save();

    return res.json({
      error: false,
      seller,
      message: "Seller added successfully",
    });
  } catch (error) {
    console.error("Seller registration error:", error);
    return res
      .status(500)
      .json({ error: true, message: "Internal server error" });
  }
});

// Get sellers route
app.get("/getSellers", authenticateToken, async (req, res) => {
  try {
    const sellers = await Seller.find({});
    return res.json({
      error: false,
      sellers,
      message: "Sellers fetched successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: true, message: "Internal server error" });
  }
});

// Get current user
app.get("/current-user", authenticateToken, async (req, res) => {
  try {
    const user = req.user.user;
    const userData = await User.findOne({ email: user.email });
    if (!userData)
      return res.status(404).json({ error: true, message: "User not found" });
    return res.json({ error: false, user: userData });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: true, message: "Internal server error" });
  }
});

// Get seller by email
app.get("/seller-by-email/:email", authenticateToken, async (req, res) => {
  try {
    const seller = await Seller.findOne({ email: req.params.email });
    if (!seller)
      return res.status(404).json({ error: true, message: "Seller not found" });
    return res.json({ error: false, seller });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: true, message: "Internal server error" });
  }
});

// Update seller by email
app.put("/update-seller/:email", authenticateToken, async (req, res) => {
  try {
    const { fullName, price, espId, currentStateOfCharge, energyQuota } =
      req.body;
    const updatedSeller = await Seller.findOneAndUpdate(
      { email: req.params.email },
      { fullName, price, espId, currentStateOfCharge, energyQuota },
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
    return res
      .status(500)
      .json({ error: true, message: "Internal server error" });
  }
});

// Trade route using blockchain interaction
app.post("/trade", authenticateToken, async (req, res) => {
  try {
    const { sellerEmail, amount } = req.body;
    const buyerEmail = req.user.user.email;

    // Get buyer details
    const buyer = await User.findOne({ email: buyerEmail });
    if (!buyer)
      return res.status(404).json({ error: true, message: "Buyer not found" });

    const sellerUser = await User.findOne({ email: sellerEmail });
    if (!buyer)
      return res.status(404).json({ error: true, message: "Buyer not found" });

    // Get seller details
    const seller = await Seller.findOne({ email: sellerEmail });
    if (!seller)
      return res.status(404).json({ error: true, message: "Seller not found" });

    // Check that seller blockchain address exists
    if (!seller.blockchainAddress) {
      return res.status(400).json({
        error: true,
        message: "Seller's blockchain address not found",
      });
    }

    if (!seller?.espId) {
      return res.status(400).json({
        error: true,
        message: "Seller device not configured properly",
      });
    }

    if (!espConnections.has(seller.espId)) {
      return res.status(400).json({
        error: true,
        message: "ESP device not connected. Connect ESP first",
      });
    }

    // Connect to blockchain node
    const provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
    const wallet = new ethers.Wallet(buyer.privateKey, provider);
    const contract = new ethers.Contract(
      blockchainConfig.contractAddress,
      blockchainConfig.contractABI,
      wallet
    );

    const energyQuota = seller.energyQuota;
    const stateOfCharge = seller.currentStateOfCharge;

    // Execute trade on blockchain
    const tx = await contract.tradeEnergy(
      seller.blockchainAddress,
      energyQuota,
      stateOfCharge
    );
    const receipt = await tx.wait();

    const totalCost = amount * energyQuota;
    sellerUser.balance += totalCost;
    buyer.balance -= totalCost;

    await buyer.save();
    await sellerUser.save();

    // Initialize transfer state - USE ESP ID AS KEY
    const transferState = {
      target: seller.energyQuota,
      accumulated: 0,
      transactionHash: tx.hash,
      startTime: Date.now(),
      timeout: setTimeout(() => {
        console.log(`⏰ Transfer timeout for ${seller.espId}`.yellow);
        activeTransfers.delete(seller.espId);
      }, 86400000),
    };

    activeTransfers.set(seller.espId, transferState); // KEY CHANGE HERE
    console.log(activeTransfers);
    // Send START command
    const ws = espConnections.get(seller.espId); // KEY CHANGE HERE

    console.log(
      `🔌 WebSocket State for ${seller.espId}:`,
      ws ? ws.readyState : "NO CONNECTION"
    );
    console.log(`📡 Registered Devices:`, Array.from(espConnections.keys()));

    if (ws?.readyState === WebSocket.OPEN) {
      console.log("start");
      ws.send(
        JSON.stringify({
          device_id: seller.espId, // MATCH ESP CODE FORMAT
          message: "START_TRANSFER",
        })
      );
      console.log(`🚀 Transfer started for ${seller.espId}`.green);
    }

    res.json({
      status: "TRANSFER_INITIATED",
      message: `Transfer started for ${seller.espId}`,
      transactionHash: tx.hash,
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
eventContract.on(
  "TradeCompleted",
  (sender, receiver, totalCost, chargeTransferred, event) => {
    console.log("Trade Completed!");
    console.log("Sender:", sender);
    console.log("Receiver:", receiver);
    console.log("Total Cost:", totalCost.toString());
    console.log("Charge Transferred:", chargeTransferred.toString());

    // Fetch and log updated details for sender and receiver
    updateBalances(sender);
    updateBalances(receiver);
  }
);

async function updateBalances(userAddress) {
  try {
    const details = await eventContract.getUserDetails(userAddress);
    console.log(`Updated details for ${userAddress}: `, details);
  } catch (err) {
    console.error(
      "Error fetching updated details for",
      userAddress,
      ":",
      err.message
    );
  }
}

// Timeout Handler
async function handleTransferTimeout(espId) {
  if (!activeTransfers.has(espId)) return;

  const transfer = activeTransfers.get(espId);
  console.log(`Transfer timeout for ${espId}`);

  try {
    await TransferLog.create({
      espId,
      amount: transfer.accumulated,
      transactionHash: transfer.transactionHash,
      status: "FAILED",
    });

    const ws = espConnections.get(espId);
    if (ws)
      ws.send(JSON.stringify({ command: "STOP_TRANSFER", reason: "timeout" }));
  } catch (error) {
    console.error("Timeout handling failed:", error);
  } finally {
    activeTransfers.delete(espId);
  }
}

// Pending Transfers Recovery
async function recoverPendingTransfers() {
  try {
    const pending = await TransferLog.find({ status: "IN_PROGRESS" });

    for (const transfer of pending) {
      activeTransfers.set(transfer.espId, {
        target: transfer.target,
        accumulated: transfer.accumulated,
        transactionHash: transfer.transactionHash,
        startTime: transfer.createdAt,
        timeout: setTimeout(
          () => handleTransferTimeout(transfer.espId),
          86400000
        ),
      });

      console.log(`Resumed pending transfer for ${transfer.espId}`);
    }
  } catch (error) {
    console.error("Transfer recovery failed:", error);
  }
}
// -------------------------
// Start HTTP and WebSocket Servers on port 8000
// -------------------------
server.listen(8000, () => {
  console.log("HTTP and WebSocket servers are running on ws://localhost:8000");
});

module.exports = app;
