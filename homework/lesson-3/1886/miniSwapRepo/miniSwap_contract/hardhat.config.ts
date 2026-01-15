import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import { vars } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    polkadotTestnet: {
      // url: "http://127.0.0.1:8545",
      // accounts: [
      //   "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133",
      // ],
      url: vars.get("TESTNET_URL", "http://127.0.0.1:8545"),
      accounts: vars.has("TESTNET_PRIVATE_KEY")
        ? [vars.get("TESTNET_PRIVATE_KEY")]
        : [],
    },
  },
};

export default config;
