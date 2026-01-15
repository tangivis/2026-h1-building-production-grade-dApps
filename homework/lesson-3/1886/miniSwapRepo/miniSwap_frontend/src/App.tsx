import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Waves } from "lucide-react";
import { useConnection } from "wagmi";
import { ConfigPanel } from "./components/ConfigPanel";
// import { WalletButton } from "./components/WalletButton";
import { WalletOptions } from "./components/wallet-options";
import { SwapPanel } from "./components/SwapPanel";
import { AddLiquidityPanel } from "./components/AddLiquidityPanel";
import { RemoveLiquidityPanel } from "./components/RemoveLiquidityPanel";
import type { SwapConfig, Token, TabType } from "./types";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("swap");
  const [config, setConfig] = useState<SwapConfig>({
    swapAddress: "",
    tokens: {},
  });
  const [tokens, setTokens] = useState<Token[]>([]);

  const { isConnected } = useConnection();

  useEffect(() => {
    // 加载保存的配置
    const savedSwapAddress = localStorage.getItem("swapAddress");
    const savedTokenList = localStorage.getItem("tokenList");

    if (savedSwapAddress && savedTokenList) {
      const parsedTokens: Record<string, string> = {};
      savedTokenList.split("\n").forEach((line) => {
        const [name, addr] = line.split(": ").map((s) => s.trim());
        if (name && addr) parsedTokens[name] = addr;
      });

      // eslint-disable-next-line
      setConfig({ swapAddress: savedSwapAddress, tokens: parsedTokens });
    }
  }, []);

  useEffect(() => {
    // 更新 tokens 数组
    const tokenArray: Token[] = Object.entries(config.tokens).map(
      ([name, address]) => ({
        name,
        address,
      }),
    );
    // eslint-disable-next-line
    setTokens(tokenArray);
  }, [config]);

  const handleConfigSave = (newConfig: SwapConfig) => {
    setConfig(newConfig);
  };

  return (
    <div className="h-full w-full">
      <Toaster position="top-right" />

      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Waves className="h-12 w-12 text-white" />
            <h1 className="text-5xl font-bold text-white md:text-6xl">
              MiniSwap
            </h1>
          </div>
          <p className="mb-6 text-lg text-white/90">
            简单、快速的去中心化交易所 · Powered by Wagmi
          </p>
          {/*<WalletButton />*/}
          <WalletOptions />
        </div>

        {/* Config Panel */}
        <ConfigPanel onConfigSave={handleConfigSave} />

        {/* Main Card */}
        <div className="card">
          {/* Tabs */}
          <div className="mb-6 flex gap-2">
            <button
              className={`btn-tab ${activeTab === "swap" ? "btn-tab-active" : ""}`}
              onClick={() => setActiveTab("swap")}
            >
              交换
            </button>
            <button
              className={`btn-tab ${activeTab === "add" ? "btn-tab-active" : ""}`}
              onClick={() => setActiveTab("add")}
            >
              添加流动性
            </button>
            <button
              className={`btn-tab ${activeTab === "remove" ? "btn-tab-active" : ""}`}
              onClick={() => setActiveTab("remove")}
            >
              移除流动性
            </button>
          </div>

          {/* Tab Content */}
          {!isConnected ? (
            // <div className="py-12 text-center">
            //   <p className="mb-4 text-gray-500">请先连接钱包</p>
            //   <div className="flex justify-center">
            //     {/*<WalletButton />*/}
            //     <WalletOptions />
            //   </div>
            // </div>
            <></>
          ) : tokens.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">请先配置合约地址和代币列表</p>
            </div>
          ) : (
            <>
              {activeTab === "swap" && (
                <SwapPanel
                  tokens={tokens}
                  swapAddress={config.swapAddress as `0x${string}` | undefined}
                />
              )}
              {activeTab === "add" && (
                <AddLiquidityPanel
                  tokens={tokens}
                  swapAddress={config.swapAddress as `0x${string}` | undefined}
                />
              )}
              {activeTab === "remove" && (
                <RemoveLiquidityPanel
                  tokens={tokens}
                  swapAddress={config.swapAddress as `0x${string}` | undefined}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-white/70">
          <p>MiniSwap - 1:1 兑换比例 · 无手续费 · 无滑点</p>
        </div>
      </div>
    </div>
  );
}

export default App;
