const express = require("express");
const { ethers } = require("ethers");

const app = express();
app.use(express.json());

// Connect to Hardhat Local Node
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Smart Contract Details (Replace with your deployed contract address)
const contractAddress = "0x73511669fd4de447fed18bb79bafeac93ab7f31f";
const contractABI = [
    "function registerUser(string memory, uint256, uint256) public",
    "function tradeEnergy(address, uint256) public",
    "function getUserDetails(address) public view returns (string memory, uint256, uint256, uint256)"
];

// Hardhat Pre-funded Accounts & Their Private Keys (from your node output)
const hardhatAccounts = [
    { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" },
    { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" },
    { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" },
    { address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", privateKey: "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e" },
    { address: "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a", privateKey: "0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1" },
    { address: "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec", privateKey: "0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd" },
    { address: "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097", privateKey: "0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa" },
    { address: "0xcd3B766CCDd6AE721141F452C550Ca635964ce71", privateKey: "0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61" },
    { address: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30", privateKey: "0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0" },
    { address: "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E", privateKey: "0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd" },
    { address: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0", privateKey: "0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0" }
];

// This object will store registered users.
// Key: assigned account address, Value: { username, wallet, charge, pricePerUnit }
let assignedUsers = {};

// API: Register a New User (assign a Hardhat account)
app.post("/register", async (req, res) => {
    const { username, charge, pricePerUnit } = req.body;

    if (hardhatAccounts.length === 0) {
        return res.status(400).send("No Hardhat accounts left!");
    }

    // Assign one account (remove it from available accounts)
    const assignedAccount = hardhatAccounts.pop();

    // Create a wallet for the assigned account using its private key
    const wallet = new ethers.Wallet(assignedAccount.privateKey, provider);

    // Store the assigned account in our persistent mapping
    assignedUsers[assignedAccount.address] = {
        username,
        wallet,
        charge,       // initial charge
        pricePerUnit  // initial price per unit
    };

    // Create a contract instance with the assigned wallet
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    try {
        const tx = await contract.registerUser(username, charge, pricePerUnit);
        await tx.wait();
        res.json({ message: `✅ User ${username} registered!`, address: assignedAccount.address });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Trade Energy between Users
app.post("/trade", async (req, res) => {
    const { sender, receiver, chargeAmount } = req.body;

    // Retrieve the sender's account from the assigned users mapping
    const senderAccount = assignedUsers[sender];
    if (!senderAccount) return res.status(400).send("Sender not found!");

    // Create a contract instance with the sender's wallet
    const contract = new ethers.Contract(contractAddress, contractABI, senderAccount.wallet);

    try {
        const tx = await contract.tradeEnergy(receiver, chargeAmount);
        await tx.wait();

        // Optionally, update the local assignedUsers mapping if needed
        // For demonstration purposes, we assume the contract manages state

        res.json({ message: `✅ Trade Successful! ${chargeAmount} kWh sent from ${sender} to ${receiver}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Fetch User Details
app.get("/user/:address", async (req, res) => {
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    try {
        const details = await contract.getUserDetails(req.params.address);
        res.json({
            name: details[0],
            balance: details[1].toString(),
            chargeLevel: details[2].toString(),
            pricePerUnit: details[3].toString(),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the Express server
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
