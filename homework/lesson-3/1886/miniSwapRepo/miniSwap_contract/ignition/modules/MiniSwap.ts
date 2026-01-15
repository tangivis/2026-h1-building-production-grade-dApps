import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

interface MiniSwapModuleReturn {
  [key: string]: any;
  miniSwap: any;
  usdt: any;
  usdc: any;
  dai: any;
  weth: any;
}

module.exports = buildModule(
  "MiniSwapModule",
  (m: any): MiniSwapModuleReturn => {
    // 配置参数
    const initialSupply: number | bigint = m.getParameter(
      "initialSupply",
      1000000
    );

    // 部署测试代币 USDT
    const usdt = m.contract("Token", ["Test USDT", "USDT", initialSupply], {
      id: "USDT",
    });

    // 部署测试代币 USDC
    const usdc = m.contract("Token", ["Test USDC", "USDC", initialSupply], {
      id: "USDC",
    });

    // 部署测试代币 DAI
    const dai = m.contract("Token", ["Test DAI", "DAI", initialSupply], {
      id: "DAI",
    });

    // 部署测试代币 WETH
    const weth = m.contract("Token", ["Wrapped ETH", "WETH", initialSupply], {
      id: "WETH",
    });

    // 部署 MiniSwap 主合约
    const miniSwap = m.contract("MiniSwap", [], {
      id: "MiniSwap",
    });

    // 返回所有部署的合约
    return { miniSwap, usdt, usdc, dai, weth };
  }
);
