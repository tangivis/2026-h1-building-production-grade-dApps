import { useReadContract, useAccount } from "wagmi";
import { ERC20_ABI } from "../../ABI/ABI";
import { formatUnits } from "viem";
import { useMemo } from "react";

export const useTokenBalance = (tokenAddress: `0x${string}` | undefined) => {
  const { address } = useAccount();

  const {
    data: balance,
    refetch,
    isLoading,
  } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!tokenAddress && !!address,
    },
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: {
      enabled: !!tokenAddress,
    },
  });

  const formattedBalance = useMemo(() => {
    if (balance !== undefined && decimals !== undefined) {
      return formatUnits(balance as bigint, decimals as number);
    }
    return "0";
  }, [balance, decimals]);

  return {
    balance: formattedBalance,
    rawBalance: balance as bigint | undefined,
    decimals: decimals as number | undefined,
    isLoading,
    refetch,
  };
};
