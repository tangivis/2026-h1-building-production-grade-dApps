import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
    },
  },
  networks: {
    polkadotTestNet: {
      type: "http",
      chainType: "l1",
      url: "https://services.polkadothub-rpc.com/testnet",
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY.replace(/^['"]?(0x)?|['"]?$/g, "")]
        : [],
    },
  },
};

export default config;
