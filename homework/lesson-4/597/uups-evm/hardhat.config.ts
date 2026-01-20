import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    passetHub: {
      url: "https://services.polkadothub-rpc.com/testnet",
      accounts: process.env.AH_PRIV_KEY ? [process.env.AH_PRIV_KEY] : [],
    },
    localNode: {
      url: `http://127.0.0.1:8545`,
      accounts: process.env.LOCAL_PRIV_KEY ? [process.env.LOCAL_PRIV_KEY] : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
    },
  },
};

export default config;
