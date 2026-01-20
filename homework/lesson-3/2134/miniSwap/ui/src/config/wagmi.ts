import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, custom } from 'wagmi';
import { ethers } from 'ethers';

// Create a custom transport that overrides gasPrice for local development
const localTransport = http('http://127.0.0.1:8545');

// Local Polkadot EVM configuration
export const localChain = {
  id: 420420420,
  name: 'Local Polkadot EVM',
  nativeCurrency: {
    decimals: 18,
    name: 'DOT',
    symbol: 'DOT',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: { name: 'Block Explorer', url: '' },
  },
  testnet: true,
};

// Passet Hub Testnet configuration
export const passetHubChain = {
  id: 420420422,
  name: 'Passet Hub Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'DOT',
    symbol: 'DOT',
  },
  rpcUrls: {
    default: { http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'] },
  },
  blockExplorers: {
    default: { name: 'Polkadot Testnet Scan', url: 'https://testnet-scan.polkadot.io' },
  },
  testnet: true,
};

export const wagmiConfig = getDefaultConfig({
  appName: 'MiniSwap DEX',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [localChain, passetHubChain],
  ssr: true,
});
