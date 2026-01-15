import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { ERC20_ABI } from "../../ABI/ABI";
import { parseUnits, maxUint256 } from "viem";
import { useEffect, useMemo } from "react";

export const useTokenApprove = (
  tokenAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}` | undefined,
  amount: string,
  decimals: number | undefined,
) => {
  const {
    writeContract,
    data: hash,
    isPending: isApproving,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: spenderAddress ? [spenderAddress, spenderAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!spenderAddress,
    },
  });

  const needsApproval = useMemo(() => {
    if (allowance !== undefined && amount && decimals) {
      try {
        const amountWei = parseUnits(amount, decimals);
        return (allowance as bigint) < amountWei;
      } catch {
        return false;
      }
    }
    return false;
  }, [allowance, amount, decimals]);

  const approve = async () => {
    if (!tokenAddress || !spenderAddress) {
      throw new Error("Token address or spender address not set");
    }

    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spenderAddress, maxUint256],
    });
  };

  useEffect(() => {
    if (isConfirmed) {
      refetchAllowance();
    }
  }, [isConfirmed, refetchAllowance]);

  return {
    approve,
    needsApproval,
    isApproving: isApproving || isConfirming,
    isConfirmed,
  };
};
