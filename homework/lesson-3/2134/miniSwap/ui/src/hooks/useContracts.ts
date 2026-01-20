import { useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatUnits } from 'viem';

// Import ABIs from constants
import { MiniSwap_ABI, ERC20_ABI } from '../constants';

// Load deployment config
let deploymentConfig: any = null;

async function getDeployment() {
  if (deploymentConfig) return deploymentConfig;
  if (typeof window === 'undefined') return null;
  try {
    const response = await fetch('/deployment.json');
    if (response.ok) {
      deploymentConfig = await response.json();
      return deploymentConfig;
    }
  } catch (e) {
    console.warn('Could not load deployment config');
  }
  return null;
}

// Get contract address
export async function getContractAddress(): Promise<string> {
  const deployment = await getDeployment();
  return deployment?.contracts?.MiniSwap?.address || '0x';
}

// Get token addresses
export async function getTokenAddresses(): Promise<Record<string, string>> {
  const deployment = await getDeployment();
  return {
    USDT: deployment?.contracts?.tokens?.USDT?.address || '0x',
    USDC: deployment?.contracts?.tokens?.USDC?.address || '0x',
    DOT: deployment?.contracts?.tokens?.DOT?.address || '0x',
  };
}

// Hook to read token balance
export function useTokenBalance(tokenAddress: string | undefined, ownerAddress: string | undefined) {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: ownerAddress ? [ownerAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!tokenAddress && !!ownerAddress && tokenAddress !== '0x' && !tokenAddress.startsWith('0x0000'),
    },
  });
}

// Hook to read token decimals
export function useTokenDecimals(tokenAddress: string | undefined) {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress && tokenAddress !== '0x' && !tokenAddress.startsWith('0x0000'),
    },
  });
}

// Hook to write contract (add liquidity, swap, remove liquidity)
export function useMiniSwapWrite() {
  const { writeContract, isPending, isSuccess, data: hash } = useWriteContract();

  const addLiquidity = async (tokenA: string, tokenB: string, amount: string) => {
    const address = await getContractAddress();
    if (address === '0x') throw new Error('Contract not deployed');

    return writeContract({
      address: address as `0x${string}`,
      abi: MiniSwap_ABI,
      functionName: 'addLiquidity',
      args: [tokenA as `0x${string}`, tokenB as `0x${string}`, parseEther(amount)],
    });
  };

  const removeLiquidity = async (tokenA: string, tokenB: string, amount: string) => {
    const address = await getContractAddress();
    if (address === '0x') throw new Error('Contract not deployed');

    return writeContract({
      address: address as `0x${string}`,
      abi: MiniSwap_ABI,
      functionName: 'removeLiquidity',
      args: [tokenA as `0x${string}`, tokenB as `0x${string}`, parseEther(amount)],
    });
  };

  const swap = async (tokenIn: string, tokenOut: string, amount: string) => {
    const address = await getContractAddress();
    if (address === '0x') throw new Error('Contract not deployed');

    return writeContract({
      address: address as `0x${string}`,
      abi: MiniSwap_ABI,
      functionName: 'swap',
      args: [tokenIn as `0x${string}`, tokenOut as `0x${string}`, parseEther(amount)],
    });
  };

  // Approve token spending
  const approve = async (tokenAddress: string, spenderAddress: string, amount: string) => {
    return writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress as `0x${string}`, parseEther(amount)],
    });
  };

  // Read allowance
  const useAllowance = (tokenAddress: string, ownerAddress: string, spenderAddress: string) => {
    return useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`],
    });
  };

  return {
    addLiquidity,
    removeLiquidity,
    swap,
    approve,
    useAllowance,
    isPending,
    isSuccess,
    hash,
  };
}

// Format utility
export function formatBalance(balance: bigint | undefined, decimals: number | undefined): string {
  if (balance === undefined || decimals === undefined) return '--';
  return formatUnits(balance, decimals);
}

export { getDeployment };
