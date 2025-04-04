const { ethers } = require("hardhat");

async function waitForTransaction(txHash, pollInterval = 1000) {
  let receipt = null;
  console.log(`Waiting for transaction ${txHash} to be mined...`);
  while (!receipt) {
    receipt = await ethers.provider.getTransactionReceipt(txHash);
    if (!receipt) {
      // Wait for pollInterval milliseconds before checking again
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }
  return receipt;
}

async function main() {
  // Replace with a valid transaction hash from your Hardhat node
  const txHash = "0x2dafe5bcbd0ec5c161b29171e5c9ecfb1a582a0e080f619026d838ec24e9ef54";
  
  // Wait for the transaction receipt using our custom function
  const receipt = await waitForTransaction(txHash);
  console.log("Transaction Receipt:", receipt);

  // Get block details for the block where the transaction was mined
  const block = await ethers.provider.getBlock(receipt.blockNumber);
  console.log("Block Details:", block);
  console.log("Block Timestamp:", new Date(block.timestamp * 1000).toLocaleString());

  // Check the balance of a specified account
  const account = "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f";
  const balanceWei = await ethers.provider.getBalance(account);
  const balanceEth = ethers.utils.formatEther(balanceWei);
  console.log(`Balance of ${account}:`, balanceEth, "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
