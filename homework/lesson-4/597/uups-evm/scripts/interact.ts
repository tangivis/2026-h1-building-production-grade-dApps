import { ethers } from "hardhat";

async function main() {
    const proxyAddress = "0x6E50b5F95ea8ADa5E1549527bfFA514ee35024cA"; // 替换为代理地址

    // 使用 V1 的 ABI 连接（因为 value 和 name 都在 V1 中定义）
    const boxV1 = await ethers.getContractAt("UUPSBoxV1", proxyAddress);

    console.log("--- 读取升级前状态 ---");
    const valV1 = await boxV1.value();
    const nameV1 = await boxV1.name();
    console.log(`Value (Should be 42): ${valV1}`);
    console.log(`Name (Should be V1_Box): ${nameV1}`);

    // 使用 V2 的 ABI 连接（为了测试新功能）
    const boxV2 = await ethers.getContractAt("UUPSBoxV2", proxyAddress);

    // 尝试调用 V2 的新功能 (这证明逻辑已升级)
    console.log("\n--- 调用 V2 新功能 ---");
    let tx = await boxV2.increment();
    await tx.wait();

    tx = await boxV2.setUpgradeTime();
    await tx.wait();

    console.log("--- 读取升级后状态 ---");
    const valV2 = await boxV2.value();
    const nameV2 = await boxV2.name();
    const time = await boxV2.lastUpgradeTime();

    console.log(`Value (Should be 43): ${valV2}`); // 变化的存储：从42变为43
    console.log(`Name (Should be V1_Box): ${nameV2}`); // 未变化的存储：依然是 V1_Box
    console.log(`LastUpgradeTime (Should be > 0): ${time}`); // 新增的存储：已赋值
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});