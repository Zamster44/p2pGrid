const hre = require("hardhat");

async function main() {
    const [owner, receiver] = await hre.ethers.getSigners();
    const contractAddress = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
    const contract = await hre.ethers.getContractAt("SecureEnergyTrading", contractAddress, owner);

    console.log(`Interacting with contract at: ${contractAddress}`);

    // Register Bob
    console.log("Registering Bob...");
    await contract.registerUser("Bob", 40, 3);
    console.log("Bob registered!");

    // Check Bob's details
    const userBob = await contract.users(owner.address);
    console.log("Bob's Data:", userBob);

    // Perform an energy trade
    console.log("Trading 5 kWh...");
    await contract.tradeEnergy(receiver.address, 5);
    console.log("Trade successful!");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
