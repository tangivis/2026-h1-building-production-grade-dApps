import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";

export const WalletButton: React.FC = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="text-primary-600 flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold shadow-lg transition-colors hover:bg-gray-100"
                  >
                    <Wallet className="h-5 w-5" />
                    连接钱包
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-red-600"
                  >
                    错误的网络
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-3">
                  <button
                    onClick={openChainModal}
                    className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-white/30"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 20,
                          height: 20,
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                            style={{ width: 20, height: 20 }}
                          />
                        )}
                      </div>
                    )}
                    <span className="font-medium text-white">{chain.name}</span>
                  </button>

                  <button
                    onClick={openAccountModal}
                    className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-white/30"
                  >
                    <Wallet className="h-4 w-4 text-white" />
                    <span className="font-medium text-white">
                      {account.displayName}
                    </span>
                    {account.displayBalance && (
                      <span className="text-sm text-white/70">
                        ({account.displayBalance})
                      </span>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
