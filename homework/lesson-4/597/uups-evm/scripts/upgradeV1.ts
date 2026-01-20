import { ethers, upgrades } from "hardhat";

async function main() {
    const proxyAddress = "0x6E50b5F95ea8ADa5E1549527bfFA514ee35024cA"; // Replace with actual address

    const BoxV2 = await ethers.getContractFactory("UUPSBoxV2");
    console.log("Preparing upgrade...");

    // 1. Prepare the upgrade (validates implementation and deploys it)
    const implementationAddress = await upgrades.prepareUpgrade(proxyAddress, BoxV2) as string;
    console.log("Implementation deployed to:", implementationAddress);

    // 2. Get the proxy contract instance (as V1 to access upgradeToAndCall, or use BoxV2 ABI)
    // Note: implementationAddress is 'unknown' in return type sometimes, cast to string
    const proxy = await ethers.getContractAt("UUPSBoxV1", proxyAddress);

    // 3. Perform the upgrade manually to get the transaction
    console.log("Upgrading proxy...");
    // OpenZeppelin v5 UUPS uses upgradeToAndCall
    const tx = await proxy.upgradeToAndCall(implementationAddress, "0x");
    console.log("Upgrade Transaction Hash:", tx.hash);

    await tx.wait();
    console.log("Proxy upgraded at:", proxyAddress);

    // 4. Sync the plugin manifest (optional but recommended for future upgrades)
    console.log("Syncing upgrades manifest...");
    await upgrades.forceImport(proxyAddress, BoxV2);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});