"use client";

import React, { useState } from "react";
import { publicClient, getWalletClient } from "../utils/viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/contract";

interface WriteContractProps {
  account: string | null;
}

const WriteContract: React.FC<WriteContractProps> = ({ account }) => {
  const [newNumber, setNewNumber] = useState<string>("");
  const [status, setStatus] = useState<{ type: string | null; message: string }>({
    type: null,
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      setStatus({ type: "error", message: "请先连接钱包" });
      return;
    }

    if (!newNumber || isNaN(Number(newNumber))) {
      setStatus({ type: "error", message: "请输入有效数字" });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus({ type: "info", message: "请在钱包中确认交易..." });

      const walletClient = await getWalletClient();
      if (!walletClient) {
        setStatus({ type: "error", message: "无法获取钱包客户端" });
        return;
      }

      // 模拟合约调用
      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "setNumber",
        args: [BigInt(newNumber)],
        account: walletClient.account,
      });

      // 发送交易
      const hash = await walletClient.writeContract(request);

      setStatus({ type: "info", message: "交易已提交，等待确认..." });

      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      setStatus({
        type: "success",
        message: `交易成功！Hash: ${receipt.transactionHash.slice(0, 10)}...`,
      });

      setNewNumber("");
    } catch (err: unknown) {
      console.error("Error:", err);
      if ((err as { code: number }).code === 4001) {
        setStatus({ type: "error", message: "用户取消了交易" });
      } else {
        setStatus({ type: "error", message: `错误: ${(err as Error).message}` });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-pink-500 rounded-lg p-4 shadow-md bg-white text-pink-500 max-w-sm mx-auto space-y-4">
      <h2 className="text-lg font-bold">更新存储的数字</h2>

      {status.message && (
        <div
          className={`p-2 rounded-md text-sm ${status.type === "error"
              ? "bg-red-100 text-red-500"
              : status.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
        >
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="number"
          placeholder="输入新数字"
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
          disabled={isSubmitting || !account}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <button
          type="submit"
          disabled={isSubmitting || !account}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-300 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? "处理中..." : "更新"}
        </button>
      </form>

      {!account && (
        <p className="text-sm text-gray-500">请先连接钱包</p>
      )}
    </div>
  );
};

export default WriteContract;
