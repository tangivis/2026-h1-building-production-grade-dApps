import React, { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { parseUnits } from "viem";
import toast from "react-hot-toast";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import type { Token } from "../types";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { MINISWAP_ABI, ERC20_ABI } from "../../ABI/ABI";

interface AddLiquidityPanelProps {
  tokens: Token[];
  swapAddress: `0x${string}` | undefined;
}

export const AddLiquidityPanel: React.FC<AddLiquidityPanelProps> = ({
  tokens,
  swapAddress,
}) => {
  const { address } = useAccount();
  const [tokenA, setTokenA] = useState<`0x${string}`>();
  const [tokenB, setTokenB] = useState<`0x${string}`>();
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  const {
    balance: balanceA,
    decimals: decimalsA,
    refetch: refetchA,
  } = useTokenBalance(tokenA);
  const {
    balance: balanceB,
    decimals: decimalsB,
    refetch: refetchB,
  } = useTokenBalance(tokenB);

  // 读取 allowance A
  const { data: allowanceA, refetch: refetchAllowanceA } = useReadContract({
    address: tokenA,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && swapAddress ? [address, swapAddress] : undefined,
    query: {
      enabled: !!tokenA && !!address && !!swapAddress,
    },
  });

  // 读取 allowance B
  const { data: allowanceB, refetch: refetchAllowanceB } = useReadContract({
    address: tokenB,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && swapAddress ? [address, swapAddress] : undefined,
    query: {
      enabled: !!tokenB && !!address && !!swapAddress,
    },
  });

  // 批准合约
  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { isLoading: isApprovingTx } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // 添加流动性
  const {
    writeContract: writeAddLiquidity,
    data: addLiquidityHash,
    isPending,
  } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: addLiquidityHash,
  });

  // 检查是否需要批准
  const needsApprovalA = () => {
    if (!allowanceA || !amountA || !decimalsA) return false;
    try {
      const amountWei = parseUnits(amountA, decimalsA);
      return (allowanceA as bigint) < amountWei;
    } catch {
      return false;
    }
  };

  const needsApprovalB = () => {
    if (!allowanceB || !amountB || !decimalsB) return false;
    try {
      const amountWei = parseUnits(amountB, decimalsB);
      return (allowanceB as bigint) < amountWei;
    } catch {
      return false;
    }
  };

  // 批准代币
  const approveToken = async (
    tokenAddress: `0x${string}`,
    tokenName: string,
  ) => {
    if (!swapAddress) return;

    return new Promise<void>((resolve, reject) => {
      writeApprove(
        {
          address: tokenAddress,
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
            toast.success(`${tokenName} 批准成功`);
            resolve();
          },
          onError: (error) => {
            toast.error(`${tokenName} 批准失败`);
            reject(error);
          },
        },
      );
    });
  };

  const handleAddLiquidity = async () => {
    if (!swapAddress || !tokenA || !tokenB || !amountA || !amountB) {
      toast.error("请填写所有字段");
      return;
    }

    if (tokenA === tokenB) {
      toast.error("不能使用相同的代币");
      return;
    }

    if (amountA !== amountB) {
      toast.error("数量必须相等（1: 1比例）");
      return;
    }

    if (parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
      toast.error("金额必须大于 0");
      return;
    }

    if (parseFloat(amountA) > parseFloat(balanceA)) {
      toast.error("代币 A 余额不足");
      return;
    }

    if (parseFloat(amountB) > parseFloat(balanceB)) {
      toast.error("代币 B 余额不足");
      return;
    }

    if (!decimalsA || !decimalsB) {
      toast.error("无法获取代币精度");
      return;
    }

    const loadingToast = toast.loading("正在处理交易...");

    try {
      setIsApproving(true);

      // 批准代币 A
      if (needsApprovalA()) {
        toast.loading("正在批准代币 A... ", { id: loadingToast });
        await approveToken(
          tokenA,
          tokens.find((t) => t.address === tokenA)?.name || "Token A",
        );
        await refetchAllowanceA();
      }

      // 批准代币 B
      if (needsApprovalB()) {
        toast.loading("正在批准代币 B...", { id: loadingToast });
        await approveToken(
          tokenB,
          tokens.find((t) => t.address === tokenB)?.name || "Token B",
        );
        await refetchAllowanceB();
      }

      setIsApproving(false);

      // 添加流动性
      toast.loading("正在添加流动性...", { id: loadingToast });

      const amountAWei = parseUnits(amountA, decimalsA);
      const amountBWei = parseUnits(amountB, decimalsB);

      writeAddLiquidity(
        {
          address: swapAddress,
          abi: MINISWAP_ABI,
          functionName: "addLiquidity",
          args: [tokenA, tokenB, amountAWei, amountBWei],
        },
        {
          onSuccess: () => {
            toast.success("流动性添加成功! ", { id: loadingToast });
            setAmountA("");
            setAmountB("");
            refetchA();
            refetchB();
            refetchAllowanceA();
            refetchAllowanceB();
          },
          onError: (error: any) => {
            console.error("添加流动性失败:", error);
            toast.error(error.message || "添加流动性失败", {
              id: loadingToast,
            });
          },
        },
      );
    } catch (error: any) {
      console.error("添加流动性失败:", error);
      toast.error(error.message || "添加流动性失败", { id: loadingToast });
      setIsApproving(false);
    }
  };

  const handleAmountAChange = (value: string) => {
    setAmountA(value);
    setAmountB(value);
  };

  const handleAmountBChange = (value: string) => {
    setAmountB(value);
    setAmountA(value);
  };

  const isLoading = isPending || isConfirming || isApproving || isApprovingTx;

  return (
    <div className="space-y-4">
      {/* 代币 A */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          代币 A
        </label>
        <select
          className="input-field"
          value={tokenA || ""}
          onChange={(e) => setTokenA(e.target.value as `0x${string}`)}
          disabled={isLoading}
        >
          <option value="">选择代币</option>
          {tokens.map((token) => (
            <option key={token.address} value={token.address}>
              {token.name}
            </option>
          ))}
        </select>
        {tokenA && (
          <div className="flex justify-between px-1 text-sm text-gray-600">
            <span>余额: {parseFloat(balanceA).toFixed(4)}</span>
            <button
              onClick={() => handleAmountAChange(balanceA)}
              className="text-primary-600 hover: text-primary-700 font-medium"
              disabled={isLoading}
            >
              最大
            </button>
          </div>
        )}
      </div>

      {/* 数量 A */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          数量 A
        </label>
        <input
          type="number"
          className="input-field"
          placeholder="0. 0"
          value={amountA}
          onChange={(e) => handleAmountAChange(e.target.value)}
          disabled={isLoading}
          step="0.01"
          min="0"
        />
      </div>

      {/* Plus 图标 */}
      <div className="flex justify-center">
        <div className="bg-primary-100 rounded-full p-2">
          <Plus className="text-primary-600 h-5 w-5" />
        </div>
      </div>

      {/* 代币 B */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          代币 B
        </label>
        <select
          className="input-field"
          value={tokenB || ""}
          onChange={(e) => setTokenB(e.target.value as `0x${string}`)}
          disabled={isLoading}
        >
          <option value="">选择代币</option>
          {tokens.map((token) => (
            <option key={token.address} value={token.address}>
              {token.name}
            </option>
          ))}
        </select>
        {tokenB && (
          <div className="flex justify-between px-1 text-sm text-gray-600">
            <span>余额: {parseFloat(balanceB).toFixed(4)}</span>
            <button
              onClick={() => handleAmountBChange(balanceB)}
              className="text-primary-600 hover:text-primary-700 font-medium"
              disabled={isLoading}
            >
              最大
            </button>
          </div>
        )}
      </div>

      {/* 数量 B */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          数量 B
        </label>
        <input
          type="number"
          className="input-field"
          placeholder="0.0"
          value={amountB}
          onChange={(e) => handleAmountBChange(e.target.value)}
          disabled={isLoading}
          step="0.01"
          min="0"
        />
      </div>

      {/* 提示信息 */}
      <div className="info-box">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">比例要求</span>
          <span className="font-semibold text-gray-900">
            1:1（数量必须相等）
          </span>
        </div>
        {amountA && amountB && amountA !== amountB && (
          <div className="text-sm font-medium text-red-600">
            ⚠️ 数量不相等，请调整
          </div>
        )}
        {needsApprovalA() && (
          <div className="text-sm font-medium text-amber-600">
            ℹ️ 需要批准代币 A
          </div>
        )}
        {needsApprovalB() && (
          <div className="text-sm font-medium text-amber-600">
            ℹ️ 需要批准代币 B
          </div>
        )}
      </div>

      {/* 添加按钮 */}
      <button
        onClick={handleAddLiquidity}
        disabled={
          isLoading ||
          !tokenA ||
          !tokenB ||
          !amountA ||
          !amountB ||
          amountA !== amountB
        }
        className="btn-primary flex items-center justify-center gap-2"
      >
        {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        {isLoading ? "处理中..." : "添加流动性"}
      </button>
    </div>
  );
};
