const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log("Network chain ID:", chainId);

  // Deploy TokenA (USDT-like)
  console.log("\n1. Deploying TokenA...");
  const initialSupply = hre.ethers.parseEther("1000000"); // 1 million tokens
  const TokenA = await hre.ethers.getContractFactory("ERC20Token");
  const tokenA = await TokenA.deploy("Mini USDT", "USDT", initialSupply);
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("TokenA deployed to:", tokenAAddress);

  // Deploy TokenB (USDC-like)
  console.log("\n2. Deploying TokenB...");
  const TokenB = await hre.ethers.getContractFactory("ERC20Token");
  const tokenB = await TokenB.deploy("Mini USDC", "USDC", initialSupply);
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("TokenB deployed to:", tokenBAddress);

  // Deploy TokenC (DOT-like)
  console.log("\n3. Deploying TokenC...");
  const TokenC = await hre.ethers.getContractFactory("ERC20Token");
  const tokenC = await TokenC.deploy("Mini DOT", "DOT", initialSupply);
  await tokenC.waitForDeployment();
  const tokenCAddress = await tokenC.getAddress();
  console.log("TokenC deployed to:", tokenCAddress);

  // Deploy MiniSwap
  console.log("\n4. Deploying MiniSwap...");
  const MiniSwap = await hre.ethers.getContractFactory("MiniSwap");
  const miniSwap = await MiniSwap.deploy();
  await miniSwap.waitForDeployment();
  const miniSwapAddress = await miniSwap.getAddress();
  console.log("MiniSwap deployed to:", miniSwapAddress);

  // Get contract artifacts for ABI
  const miniSwapArtifact = await hre.artifacts.readArtifact("MiniSwap");
  const erc20Artifact = await hre.artifacts.readArtifact("ERC20Token");

  // Print deployment summary
  console.log("\n==========================================");
  console.log("        Deployment Summary              ");
  console.log("==========================================");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", chainId);
  console.log("TokenA (USDT):", tokenAAddress);
  console.log("TokenB (USDC):", tokenBAddress);
  console.log("TokenC (DOT):", tokenCAddress);
  console.log("MiniSwap:", miniSwapAddress);
  console.log("==========================================\n");

  // Save deployment info to deployment.json
  const deploymentInfo = {
    network: hre.network.name,
    chainId: chainId,
    deployer: deployer.address,
    contracts: {
      MiniSwap: {
        address: miniSwapAddress,
        abi: miniSwapArtifact.abi
      },
      tokens: {
        USDT: {
          address: tokenAAddress,
          symbol: "USDT",
          name: "Mini USDT",
          abi: erc20Artifact.abi
        },
        USDC: {
          address: tokenBAddress,
          symbol: "USDC",
          name: "Mini USDC",
          abi: erc20Artifact.abi
        },
        DOT: {
          address: tokenCAddress,
          symbol: "DOT",
          name: "Mini DOT",
          abi: erc20Artifact.abi
        }
      }
    },
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("Deployment info saved to deployment.json");

  // Generate frontend config file
  generateFrontendConfig(deploymentInfo);

  // Copy deployment.json to ui/public for frontend access
  const uiPublicDir = path.join(__dirname, "../ui/public");
  if (!fs.existsSync(uiPublicDir)) {
    fs.mkdirSync(uiPublicDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(uiPublicDir, "deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("Deployment info copied to ui/public/deployment.json");

  // After deployment, send some tokens to the deployer for testing
  console.log("\n5. Verifying token balances...");
  const balanceA = await tokenA.balanceOf(deployer.address);
  const balanceB = await tokenB.balanceOf(deployer.address);
  const balanceC = await tokenC.balanceOf(deployer.address);
  console.log("TokenA balance:", hre.ethers.formatEther(balanceA));
  console.log("TokenB balance:", hre.ethers.formatEther(balanceB));
  console.log("TokenC balance:", hre.ethers.formatEther(balanceC));

  console.log("\n✅ Deployment completed successfully!");
  console.log("💡 Run 'cd ui && npm run dev' to start the frontend");
}

function generateFrontendConfig(deploymentInfo) {
  const configContent = `// Auto-generated from deployment. DO NOT EDIT manually.
// Run deployment script to update this file.

export const DEPLOYMENT = ${JSON.stringify(deploymentInfo, null, 2)} as const;

export const CONTRACTS = {
  chainId: ${deploymentInfo.chainId},
  miniSwap: "${deploymentInfo.contracts.MiniSwap.address}",
  tokens: {
    USDT: "${deploymentInfo.contracts.tokens.USDT.address}",
    USDC: "${deploymentInfo.contracts.tokens.USDC.address}",
    DOT: "${deploymentInfo.contracts.tokens.DOT.address}"
  }
};

export const MiniSwap_ADDRESS = "${deploymentInfo.contracts.MiniSwap.address}";
export const MiniSwap_ABI = ${JSON.stringify(deploymentInfo.contracts.MiniSwap.abi, null, 2)};

export const ERC20_ABI = ${JSON.stringify(deploymentInfo.contracts.tokens.USDT.abi, null, 2)};
`;

  const configPath = path.join(__dirname, "../ui/src/config.ts");
  fs.writeFileSync(configPath, configContent);
  console.log("Frontend config generated at ui/src/config.ts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
