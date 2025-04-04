const hre = require("hardhat");

async function main() {
    // Get the contract factory
    const SecureEnergyTrading = await hre.ethers.getContractFactory("SecureEnergyTrading");

    // Deploy the contract
    const contract = await SecureEnergyTrading.deploy();
    await contract.waitForDeployment();

    // Log the contract address
    console.log("SecureEnergyTrading deployed at:", contract.target);
}

// Run the deployment script
main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
