import { createPublicClient, createWalletClient, custom, http, Chain } from "viem";

// 定义 Polkadot Hub Testnet 链
export const polkadotTestnet: Chain = {
  id: 420420417,
  name: "Polkadot Hub Testnet",
  nativeCurrency: {
    name: "Paseo Token",
    symbol: "PAS",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://services.polkadothub-rpc.com/testnet"],
    },
  },
};

// 用于读取链上数据的客户端
export const publicClient = createPublicClient({
  chain: polkadotTestnet,
  transport: http(),
});

// 用于发送交易的钱包客户端
export const getWalletClient = async () => {
  if (typeof window === "undefined" || !window.ethereum) return null;

  return createWalletClient({
    chain: polkadotTestnet,
    transport: custom(window.ethereum),
  });
};
