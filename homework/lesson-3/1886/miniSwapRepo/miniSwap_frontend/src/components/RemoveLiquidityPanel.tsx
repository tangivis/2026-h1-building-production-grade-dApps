import React, { useState, useEffect } from "react";
import { Minus, Loader2 } from "lucide-react";
import { parseEther, formatEther } from "viem";
import toast from "react-hot-toast";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import type { Token } from "../types";
import { MINISWAP_ABI } from "../../ABI/ABI";

interface RemoveLiquidityPanelProps {
  tokens: Token[];
  swapAddress: `0x${string}` | undefined;
}

export const RemoveLiquidityPanel: React.FC<RemoveLiquidityPanelProps> = ({
  tokens,
  swapAddress,
}) => {
  const { address } = useAccount();
  const [tokenA, setTokenA] = useState<`0x${string}`>();
  const [tokenB, setTokenB] = useState<`0x${string}`>();
  const [liquidityAmount, setLiquidityAmount] = useState("");
  const [poolInfo, setPoolInfo] = useState({
    reserveA: "0",
    reserveB: "0",
    totalLiquidity: "0",
  });
  const [userLiquidity, setUserLiquidity] = useState("0");

  // 读取池子信息
  const { data: poolData, refetch: refetchPool } = useReadContract({
    address: swapAddress,
    abi: MINISWAP_ABI,
    functionName: "getPool",
    args: tokenA && tokenB ? [tokenA, tokenB] : undefined,
    query: {
      enabled: !!swapAddress && !!tokenA && !!tokenB,
    },
  });

  // 读取用户流动性
  const { data: userLiqData, refetch: refetchUserLiq } = useReadContract({
    address: swapAddress,
    abi: MINISWAP_ABI,
    functionName: "getUserLiquidity",
    args: tokenA && tokenB && address ? [tokenA, tokenB, address] : undefined,
    query: {
      enabled: !!swapAddress && !!tokenA && !!tokenB && !!address,
    },
  });

  // 更新池子信息
  useEffect(() => {
    if (poolData) {
      const [, , reserve0, reserve1, totalLiq] = poolData as [
        string,
        string,
        bigint,
        bigint,
        bigint,
      ];
      // eslint-disable-next-line
      setPoolInfo({
        reserveA: formatEther(reserve0),
        reserveB: formatEther(reserve1),
        totalLiquidity: formatEther(totalLiq),
      });
    } else {
      setPoolInfo({
        reserveA: "0",
        reserveB: "0",
        totalLiquidity: "0",
      });
    }
  }, [poolData]);

  // 更新用户流动性
  useEffect(() => {
    if (userLiqData) {
      // eslint-disable-next-line
      setUserLiquidity(formatEther(userLiqData as bigint));
    } else {
      setUserLiquidity("0");
    }
  }, [userLiqData]);

  // 移除流动性
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleRemoveLiquidity = async () => {
    if (!swapAddress || !tokenA || !tokenB || !liquidityAmount) {
      toast.error("请填写所有字段");
      return;
    }

    if (parseFloat(liquidityAmount) <= 0) {
      toast.error("金额必须大于 0");
      return;
    }

    if (parseFloat(liquidityAmount) > parseFloat(userLiquidity)) {
      toast.error("流动性不足");
      return;
    }

    const loadingToast = toast.loading("正在处理交易...");

    try {
      const liquidityWei = parseEther(liquidityAmount);

      writeContract(
        {
          address: swapAddress,
          abi: MINISWAP_ABI,
          functionName: "removeLiquidity",
          args: [tokenA, tokenB, liquidityWei],
        },
        {
          onSuccess: () => {
            toast.loading("交易已提交，等待确认...", { id: loadingToast });
          },
          onError: (error: any) => {
            console.error("移除流动性失败:", error);
            toast.error(error.message || "移除流动性失败", {
              id: loadingToast,
            });
          },
        },
      );
    } catch (error: any) {
      console.error("移除流动性失败:", error);
      toast.error(error.message || "移除流动性失败", { id: loadingToast });
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("流动性移除成功!");
      // eslint-disable-next-line
      setLiquidityAmount("");
      refetchPool();
      refetchUserLiq();
    }
  }, [isSuccess, refetchPool, refetchUserLiq]);

  // 当代币改变时刷新数据
  useEffect(() => {
    if (tokenA && tokenB) {
      refetchPool();
      refetchUserLiq();
    }
  }, [tokenA, tokenB, refetchPool, refetchUserLiq]);

  const isLoading = isPending || isConfirming;

  return (
    <div className="space-y-4">
      {/* 代币对选择 */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          代币对
        </label>
        <div className="grid grid-cols-2 gap-3">
          <select
            className="input-field"
            value={tokenA || ""}
            onChange={(e) => setTokenA(e.target.value as `0x${string}`)}
            disabled={isLoading}
          >
            <option value="">代币 A</option>
            {tokens.map((token) => (
              <option key={token.address} value={token.address}>
                {token.name}
              </option>
            ))}
          </select>
          <select
            className="input-field"
            value={tokenB || ""}
            onChange={(e) => setTokenB(e.target.value as `0x${string}`)}
            disabled={isLoading}
          >
            <option value="">代币 B</option>
            {tokens.map((token) => (
              <option key={token.address} value={token.address}>
                {token.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 流动性数量 */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          流动性数量
        </label>
        <input
          type="number"
          className="input-field"
          placeholder="0.0"
          value={liquidityAmount}
          onChange={(e) => setLiquidityAmount(e.target.value)}
          disabled={isLoading}
          step="0.01"
          min="0"
        />
        {tokenA && tokenB && (
          <div className="flex justify-between px-1 text-sm text-gray-600">
            <span>你的流动性: {parseFloat(userLiquidity).toFixed(4)}</span>
            <button
              onClick={() => setLiquidityAmount(userLiquidity)}
              className="text-primary-600 hover:text-primary-700 font-medium"
              disabled={isLoading || parseFloat(userLiquidity) === 0}
            >
              最大
            </button>
          </div>
        )}
      </div>

      {/* 池子信息 */}
      {tokenA && tokenB && (
        <div className="info-box">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">池子储备 A</span>
            <span className="font-semibold text-gray-900">
              {parseFloat(poolInfo.reserveA).toFixed(4)}{" "}
              {tokens.find((t) => t.address === tokenA)?.name}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">池子储备 B</span>
            <span className="font-semibold text-gray-900">
              {parseFloat(poolInfo.reserveB).toFixed(4)}{" "}
              {tokens.find((t) => t.address === tokenB)?.name}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">总流动性</span>
            <span className="font-semibold text-gray-900">
              {parseFloat(poolInfo.totalLiquidity).toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* 预计获得 */}
      {tokenA &&
        tokenB &&
        liquidityAmount &&
        parseFloat(liquidityAmount) > 0 && (
          <div className="info-box border-primary-200 border-2">
            <div className="mb-2 text-sm font-semibold text-gray-700">
              预计获得:{" "}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {tokens.find((t) => t.address === tokenA)?.name}
              </span>
              <span className="font-semibold text-gray-900">
                {parseFloat(poolInfo.totalLiquidity) > 0
                  ? (
                      (parseFloat(liquidityAmount) /
                        parseFloat(poolInfo.totalLiquidity)) *
                      parseFloat(poolInfo.reserveA)
                    ).toFixed(4)
                  : "0"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {tokens.find((t) => t.address === tokenB)?.name}
              </span>
              <span className="font-semibold text-gray-900">
                {parseFloat(poolInfo.totalLiquidity) > 0
                  ? (
                      (parseFloat(liquidityAmount) /
                        parseFloat(poolInfo.totalLiquidity)) *
                      parseFloat(poolInfo.reserveB)
                    ).toFixed(4)
                  : "0"}
              </span>
            </div>
          </div>
        )}

      {/* 移除按钮 */}
      <button
        onClick={handleRemoveLiquidity}
        disabled={
          isLoading ||
          !tokenA ||
          !tokenB ||
          !liquidityAmount ||
          parseFloat(liquidityAmount) <= 0
        }
        className="btn-primary flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Minus className="h-5 w-5" />
        )}
        {isLoading ? "处理中..." : "移除流动性"}
      </button>
    </div>
  );
};
