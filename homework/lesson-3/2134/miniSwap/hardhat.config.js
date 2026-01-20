require("@nomicfoundation/hardhat-toolbox");
require("@parity/hardhat-polkadot");

require("dotenv").config();

const LOCAL_PRIV_KEY = process.env.LOCAL_PRIV_KEY || "5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133";
const AH_PRIV_KEY = process.env.AH_PRIV_KEY;

// Additional test accounts for local testing (derived from HD wallet)
const TEST_PRIV_KEYS = [
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Account #1
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Account #2
];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 100000000,
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    local: {
      url: "http://127.0.0.1:8545",
      chainId: 420420420,
      accounts: AH_PRIV_KEY
        ? [AH_PRIV_KEY, LOCAL_PRIV_KEY, ...TEST_PRIV_KEYS]
        : [LOCAL_PRIV_KEY, ...TEST_PRIV_KEYS],
      gasPrice: 0, // Free gas on local network
      gas: "auto",
    },
    passetHub: {
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      chainId: 420420422,
      accounts: AH_PRIV_KEY
        ? [AH_PRIV_KEY, LOCAL_PRIV_KEY, ...TEST_PRIV_KEYS]
        : [LOCAL_PRIV_KEY, ...TEST_PRIV_KEYS],
    },
  },
};
