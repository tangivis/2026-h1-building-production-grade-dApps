import { ethers, upgrades } from "hardhat";

async function main() {
    const BoxV1 = await ethers.getContractFactory("UUPSBoxV1");
    console.log("Deploying UUPSBoxV1...");

    // 部署代理，调用 initialize 函数并传入初始值 42
    const proxy = await upgrades.deployProxy(BoxV1, [42], { initializer: "initialize" });
    await proxy.waitForDeployment();

    const address = await proxy.getAddress();
    console.log("UUPSBoxV1 Proxy deployed to:", address);

    // 在这里记录部署 Hash（可以通过 provider 获取，但在实际控制台输出中可见）
    console.log("Deployment Transaction Hash:", proxy.deploymentTransaction()?.hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});