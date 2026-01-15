export interface Token {
  name: string;
  address: string;
  symbol?: string;
  decimals?: number;
}

export interface PoolInfo {
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  totalLiquidity: string;
}

export interface SwapConfig {
  swapAddress: string;
  tokens: Record<string, string>;
}

export type TabType = "swap" | "add" | "remove";

export interface Balance {
  [tokenAddress: string]: string;
}

export interface UserLiquidity {
  tokenA: string;
  tokenB: string;
  amount: string;
}
