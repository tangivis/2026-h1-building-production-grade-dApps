import { useReadContract } from "wagmi";
import { MINISWAP_ABI } from "../../ABI/ABI";
import { formatEther } from "viem";
import { useMemo } from "react";

export const usePoolInfo = (
  contractAddress: `0x${string}` | undefined,
  tokenA: `0x${string}` | undefined,
  tokenB: `0x${string}` | undefined,
) => {
  const { data, refetch } = useReadContract({
    address: contractAddress,
    abi: MINISWAP_ABI,
    functionName: "getPool",
    args: tokenA && tokenB ? [tokenA, tokenB] : undefined,
    query: {
      enabled: !!contractAddress && !!tokenA && !!tokenB,
    },
  });

  const poolInfo = useMemo(() => {
    if (data) {
      const [, , reserve0, reserve1, totalLiq] = data as [
        string,
        string,
        bigint,
        bigint,
        bigint,
      ];
      return {
        reserveA: formatEther(reserve0),
        reserveB: formatEther(reserve1),
        totalLiquidity: formatEther(totalLiq),
      };
    }
    return {
      reserveA: "0",
      reserveB: "0",
      totalLiquidity: "0",
    };
  }, [data]);

  return { poolInfo, refetch };
};

export const useUserLiquidity = (
  contractAddress: `0x${string}` | undefined,
  tokenA: `0x${string}` | undefined,
  tokenB: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined,
) => {
  const { data, refetch } = useReadContract({
    address: contractAddress,
    abi: MINISWAP_ABI,
    functionName: "getUserLiquidity",
    args:
      tokenA && tokenB && userAddress
        ? [tokenA, tokenB, userAddress]
        : undefined,
    query: {
      enabled: !!contractAddress && !!tokenA && !!tokenB && !!userAddress,
    },
  });

  const userLiquidity = useMemo(() => {
    if (data) {
      return formatEther(data as bigint);
    }
    return "0";
  }, [data]);

  return { userLiquidity, refetch };
};
