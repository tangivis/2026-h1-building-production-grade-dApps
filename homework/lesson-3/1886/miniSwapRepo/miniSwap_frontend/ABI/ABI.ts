export const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
];

export const MINISWAP_ABI = [
  "function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external returns (uint256)",
  "function removeLiquidity(address tokenA, address tokenB, uint256 liquidity) external returns (uint256, uint256)",
  "function swap(address tokenIn, address tokenOut, uint256 amountIn) external returns (uint256)",
  "function getPool(address tokenA, address tokenB) external view returns (address, address, uint256, uint256, uint256)",
  "function getUserLiquidity(address tokenA, address tokenB, address user) external view returns (uint256)",
  "event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)",
  "event LiquidityAdded(address indexed provider, address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 liquidity)",
  "event LiquidityRemoved(address indexed provider, address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 liquidity)",
];
