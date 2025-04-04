const axios = require("axios");
const { ethers } = require("hardhat");

async function main() {
    // For demonstration, we get Hardhat signers (though registration uses our hardcoded accounts)
    const [owner, user1, user2] = await ethers.getSigners();

    console.log("🔄 Registering users...");

    // Register Alice (server assigns an account; the address returned is used)
    const aliceRegistration = await axios.post("http://localhost:3000/register", {
        username: "Alice",
        charge: 50,
        pricePerUnit: 2,
        address: user1.address // Optional: the server will assign an account regardless
    });

    // Register Bob
    const bobRegistration = await axios.post("http://localhost:3000/register", {
        username: "Bob",
        charge: 30,
        pricePerUnit: 3,
        address: user2.address
    });

    console.log("✅ Users Registered:");
    console.log("Alice:", aliceRegistration.data);
    console.log("Bob:", bobRegistration.data);

    // Fetch registered users' details using the addresses assigned by the server
    console.log("\n🔍 Fetching user details...");
    const aliceData = await axios.get(`http://localhost:3000/user/${aliceRegistration.data.address}`);
    const bobData = await axios.get(`http://localhost:3000/user/${bobRegistration.data.address}`);
    console.log("Alice:", aliceData.data);
    console.log("Bob:", bobData.data);

    // Perform a trade: Alice sends 5 kWh to Bob
    console.log("\n🔄 Initiating energy trade...");
    const tradeResponse = await axios.post("http://localhost:3000/trade", {
        sender: aliceRegistration.data.address,
        receiver: bobRegistration.data.address,
        chargeAmount: 5
    });
    console.log("✅ Trade Completed:", tradeResponse.data);

    // Fetch updated user details
    console.log("\n🔍 Fetching updated user details...");
    const updatedAlice = await axios.get(`http://localhost:3000/user/${aliceRegistration.data.address}`);
    const updatedBob = await axios.get(`http://localhost:3000/user/${bobRegistration.data.address}`);
    console.log("Alice (Updated):", updatedAlice.data);
    console.log("Bob (Updated):", updatedBob.data);
}

main().catch(console.error);
