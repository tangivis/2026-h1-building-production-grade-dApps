import React, { useState, useEffect } from "react";
import { ArrowDownUp, Loader2 } from "lucide-react";
import { parseUnits } from "viem";
import toast from "react-hot-toast";
import {
  useConnection,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import type { Token } from "../types";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { MINISWAP_ABI, ERC20_ABI } from "../../ABI/ABI";

interface SwapPanelProps {
  tokens: Token[];
  swapAddress: `0x${string}` | undefined;
}

export const SwapPanel: React.FC<SwapPanelProps> = ({
  tokens,
  swapAddress,
}) => {
  const { address } = useConnection();
  const [tokenIn, setTokenIn] = useState<`0x${string}`>();
  const [tokenOut, setTokenOut] = useState<`0x${string}`>();
  const [amountIn, setAmountIn] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  const {
    balance: balanceIn,
    decimals: decimalsIn,
    refetch: refetchIn,
  } = useTokenBalance(tokenIn);
  const { balance: balanceOut, refetch: refetchOut } =
    useTokenBalance(tokenOut);

  // 读取 allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenIn,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && swapAddress ? [address, swapAddress] : undefined,
    query: {
      enabled: !!tokenIn && !!address && !!swapAddress,
    },
  });

  // 批准合约
  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { isLoading: isApprovingTx } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // 交换
  const {
    writeContract: writeSwap,
    data: swapHash,
    isPending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: swapHash,
  });

  // 检查是否需要批准
  const needsApproval = () => {
    if (!allowance || !amountIn || !decimalsIn) return false;
    try {
      const amountWei = parseUnits(amountIn, decimalsIn);
      return (allowance as bigint) < amountWei;
    } catch {
      return false;
    }
  };

  // 批准代币
  const approveToken = async () => {
    if (!swapAddress || !tokenIn) return;

    return new Promise<void>((resolve, reject) => {
      writeApprove(
        {
          address: tokenIn,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [
            swapAddress,
            BigInt(
              "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
            ),
          ],
        },
        {
          onSuccess: () => {
            toast.success("批准成功");
            resolve();
          },
          onError: (error) => {
            toast.error("批准失败");
            reject(error);
          },
        },
      );
    });
  };

  const handleSwap = async () => {
    if (!swapAddress || !tokenIn || !tokenOut || !amountIn || !decimalsIn) {
      toast.error("请填写所有字段");
      return;
    }

    if (tokenIn === tokenOut) {
      toast.error("不能交换相同的代币");
      return;
    }

    if (parseFloat(amountIn) <= 0) {
      toast.error("金额必须大于 0");
      return;
    }

    if (parseFloat(amountIn) > parseFloat(balanceIn)) {
      toast.error("余额不足");
      return;
    }

    const loadingToast = toast.loading("正在处理交易.. .");

    try {
      // 如果需要批准，先批准
      if (needsApproval()) {
        setIsApproving(true);
        toast.loading("正在批准代币... ", { id: loadingToast });
        await approveToken();
        await refetchAllowance();
        setIsApproving(false);
      }

      toast.loading("正在交换... ", { id: loadingToast });

      const amountWei = parseUnits(amountIn, decimalsIn);

      writeSwap(
        {
          address: swapAddress,
          abi: MINISWAP_ABI,
          functionName: "swap",
          args: [tokenIn, tokenOut, amountWei],
        },
        {
          onSuccess: () => {
            toast.loading("交易已提交，等待确认...", { id: loadingToast });
          },
          onError: (error: any) => {
            console.error("交换失败:", error);
            toast.error(error.message || "交换失败", { id: loadingToast });
          },
        },
      );
    } catch (error: any) {
      console.error("交换失败:", error);
      toast.error(error.message || "交换失败", { id: loadingToast });
      setIsApproving(false);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("交换成功! ");
      // eslint-disable-next-line
      setAmountIn("");
      refetchIn();
      refetchOut();
      refetchAllowance();
    }
  }, [isSuccess, refetchIn, refetchOut, refetchAllowance]);

  const switchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  };

  const isLoading = isPending || isConfirming || isApproving || isApprovingTx;

  return (
    <div className="space-y-4">
      {/* 输入代币 */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          输入代币
        </label>
        <select
          className="input-field"
          value={tokenIn || ""}
          onChange={(e) => setTokenIn(e.target.value as `0x${string}`)}
          disabled={isLoading}
        >
          <option value="">选择代币</option>
          {tokens.map((token) => (
            <option key={token.address} value={token.address}>
              {token.name}
            </option>
          ))}
        </select>
        {tokenIn && (
          <div className="flex justify-between px-1 text-sm text-gray-600">
            <span>余额: {parseFloat(balanceIn).toFixed(4)}</span>
            <button
              onClick={() => setAmountIn(balanceIn)}
              className="text-primary-600 hover:text-primary-700 font-medium"
              disabled={isLoading}
            >
              最大
            </button>
          </div>
        )}
      </div>

      {/* 输入数量 */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          输入数量
        </label>
        <input
          type="number"
          className="input-field"
          placeholder="0.0"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
          disabled={isLoading}
          step="0.01"
          min="0"
        />
      </div>

      {/* 切换按钮 */}
      <div className="flex justify-center">
        <button
          onClick={switchTokens}
          className="rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
          disabled={isLoading}
        >
          <ArrowDownUp className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* 输出代币 */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          输出代币
        </label>
        <select
          className="input-field"
          value={tokenOut || ""}
          onChange={(e) => setTokenOut(e.target.value as `0x${string}`)}
          disabled={isLoading}
        >
          <option value="">选择代币</option>
          {tokens.map((token) => (
            <option key={token.address} value={token.address}>
              {token.name}
            </option>
          ))}
        </select>
        {tokenOut && (
          <div className="px-1 text-sm text-gray-600">
            余额: {parseFloat(balanceOut).toFixed(4)}
          </div>
        )}
      </div>

      {/* 交易信息 */}
      <div className="info-box">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">预计获得</span>
          <span className="font-semibold text-gray-900">
            {amountIn || "0"}{" "}
            {tokens.find((t) => t.address === tokenOut)?.name || ""}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">兑换比例</span>
          <span className="font-semibold text-gray-900">1: 1</span>
        </div>
        {needsApproval() && (
          <div className="mt-2 text-sm font-medium text-amber-600">
            ℹ️ 需要先批准代币
          </div>
        )}
      </div>

      {/* 交换按钮 */}
      <button
        onClick={handleSwap}
        disabled={isLoading || !tokenIn || !tokenOut || !amountIn}
        className="btn-primary flex items-center justify-center gap-2"
      >
        {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        {isLoading ? "处理中..." : needsApproval() ? "批准并交换" : "交换"}
      </button>
    </div>
  );
};
