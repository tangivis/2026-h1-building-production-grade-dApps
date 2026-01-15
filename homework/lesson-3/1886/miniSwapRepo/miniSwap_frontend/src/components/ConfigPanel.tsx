import React, { useState, useEffect } from "react";
import { Settings, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { SwapConfig } from "../types";

interface ConfigPanelProps {
  onConfigSave: (config: SwapConfig) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ onConfigSave }) => {
  const [swapAddress, setSwapAddress] = useState("");
  const [tokenList, setTokenList] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const savedSwapAddress = localStorage.getItem("swapAddress");
    const savedTokenList = localStorage.getItem("tokenList");

    // eslint-disable-next-line
    if (savedSwapAddress) setSwapAddress(savedSwapAddress);
    if (savedTokenList) setTokenList(savedTokenList);
  }, []);

  const handleSave = () => {
    if (!swapAddress || swapAddress.length !== 42) {
      toast.error("请输入有效的合约地址");
      return;
    }

    const tokens: Record<string, string> = {};
    const lines = tokenList.split("\n");

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed) {
        const [name, address] = trimmed.split(": ").map((s) => s.trim());
        if (name && address && address.length === 42) {
          tokens[name] = address;
        }
      }
    });

    if (Object.keys(tokens).length === 0) {
      toast.error("请至少配置一个有效的代币");
      return;
    }

    localStorage.setItem("swapAddress", swapAddress);
    localStorage.setItem("tokenList", tokenList);

    onConfigSave({ swapAddress, tokens });
    toast.success("配置已保存");
    setIsExpanded(false);
  };

  return (
    <div className="card config-box mb-6">
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-bold text-amber-800">合约配置</h3>
        </div>
        <span className="text-xl text-amber-600">{isExpanded ? "−" : "+"}</span>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              MiniSwap 合约地址
            </label>
            <input
              type="text"
              className="input-field font-mono text-sm"
              placeholder="0x..."
              value={swapAddress}
              onChange={(e) => setSwapAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Token 列表 (格式: 名称: 地址)
            </label>
            <textarea
              className="input-field resize-none font-mono text-sm"
              rows={5}
              placeholder="USDT: 0x... &#10;USDC: 0x...&#10;DAI:  0x..."
              value={tokenList}
              onChange={(e) => setTokenList(e.target.value)}
            />
          </div>

          <button
            onClick={handleSave}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Save className="h-5 w-5" />
            保存配置
          </button>
        </div>
      )}
    </div>
  );
};
