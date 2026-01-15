// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MiniSwap is ReentrancyGuard {
    // 流动性池结构
    struct Pool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidity;
    }
    
    // 交易对哈希 => 池子
    mapping(bytes32 => Pool) public pools;
    
    // 所有交易对列表
    bytes32[] public allPairs;
    
    event LiquidityAdded(
        address indexed provider,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event LiquidityRemoved(
        address indexed provider,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    // 获取交易对的唯一标识
    function getPairHash(address tokenA, address tokenB) public pure returns (bytes32) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return keccak256(abi.encodePacked(token0, token1));
    }
    
    // 获取排序后的代币地址
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "Identical addresses");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "Zero address");
    }
    
    /**
     * @dev 添加流动性
     * @param tokenA 代币A地址
     * @param tokenB 代币B地址
     * @param amountA 代币A数量
     * @param amountB 代币B数量
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant returns (uint256 liquidity) {
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0");
        require(tokenA != tokenB, "Cannot create pair with same token");
        
        bytes32 pairHash = getPairHash(tokenA, tokenB);
        Pool storage pool = pools[pairHash];
        
        // 如果是新池子，初始化
        if (pool. tokenA == address(0)) {
            (address token0, address token1) = sortTokens(tokenA, tokenB);
            pool.tokenA = token0;
            pool. tokenB = token1;
            allPairs.push(pairHash);
        }
        
        // 确定代币顺序
        (uint256 amount0, uint256 amount1) = tokenA == pool.tokenA 
            ? (amountA, amountB) 
            : (amountB, amountA);
        
        // 由于是1:1兑换，要求添加的流动性数量相等
        require(amount0 == amount1, "Amounts must be equal for 1:1 ratio");
        
        // 转入代币
        IERC20(pool.tokenA).transferFrom(msg.sender, address(this), amount0);
        IERC20(pool. tokenB).transferFrom(msg.sender, address(this), amount1);
        
        // 计算流动性（简单使用添加的数量）
        liquidity = amount0; // 由于1:1，使用任一数量即可
        
        // 更新池子状态
        pool.reserveA += amount0;
        pool.reserveB += amount1;
        pool.totalLiquidity += liquidity;
        pool.liquidity[msg.sender] += liquidity;
        
        emit LiquidityAdded(msg.sender, tokenA, tokenB, amountA, amountB, liquidity);
    }
    
    /**
     * @dev 移除流动性
     * @param tokenA 代币A地址
     * @param tokenB 代币B地址
     * @param liquidity 要移除的流动性数量
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        require(liquidity > 0, "Liquidity must be greater than 0");
        
        bytes32 pairHash = getPairHash(tokenA, tokenB);
        Pool storage pool = pools[pairHash];
        
        require(pool.tokenA != address(0), "Pool does not exist");
        require(pool.liquidity[msg.sender] >= liquidity, "Insufficient liquidity");
        
        // 计算可以取回的代币数量（按比例）
        uint256 amount0 = (liquidity * pool.reserveA) / pool.totalLiquidity;
        uint256 amount1 = (liquidity * pool.reserveB) / pool.totalLiquidity;
        
        require(amount0 > 0 && amount1 > 0, "Insufficient liquidity burned");
        
        // 更新池子状态
        pool.liquidity[msg.sender] -= liquidity;
        pool.totalLiquidity -= liquidity;
        pool.reserveA -= amount0;
        pool.reserveB -= amount1;
        
        // 转出代币
        IERC20(pool.tokenA).transfer(msg.sender, amount0);
        IERC20(pool.tokenB).transfer(msg.sender, amount1);
        
        // 确定返回值顺序
        (amountA, amountB) = tokenA == pool.tokenA 
            ? (amount0, amount1) 
            : (amount1, amount0);
        
        emit LiquidityRemoved(msg.sender, tokenA, tokenB, amountA, amountB, liquidity);
    }
    
    /**
     * @dev 交换代币 (1:1比例)
     * @param tokenIn 输入代币地址
     * @param tokenOut 输出代币地址
     * @param amountIn 输入代币数量
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be greater than 0");
        require(tokenIn != tokenOut, "Cannot swap same token");
        
        bytes32 pairHash = getPairHash(tokenIn, tokenOut);
        Pool storage pool = pools[pairHash];
        
        require(pool.tokenA != address(0), "Pool does not exist");
        
        // 1:1兑换，输出数量等于输入数量
        amountOut = amountIn;
        
        // 确定储备金
        (uint256 reserveIn, uint256 reserveOut) = tokenIn == pool.tokenA 
            ? (pool.reserveA, pool.reserveB) 
            : (pool.reserveB, pool.reserveA);
        
        require(reserveOut >= amountOut, "Insufficient liquidity");
        
        // 转入输入代币
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // 更新储备金
        if (tokenIn == pool.tokenA) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }
        
        // 转出输出代币
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }
    
    /**
     * @dev 获取池子信息
     */
    function getPool(address tokenA, address tokenB) external view returns (
        address token0,
        address token1,
        uint256 reserve0,
        uint256 reserve1,
        uint256 totalLiquidity
    ) {
        bytes32 pairHash = getPairHash(tokenA, tokenB);
        Pool storage pool = pools[pairHash];
        
        return (
            pool.tokenA,
            pool.tokenB,
            pool.reserveA,
            pool.reserveB,
            pool.totalLiquidity
        );
    }
    
    /**
     * @dev 获取用户的流动性
     */
    function getUserLiquidity(address tokenA, address tokenB, address user) external view returns (uint256) {
        bytes32 pairHash = getPairHash(tokenA, tokenB);
        Pool storage pool = pools[pairHash];
        return pool.liquidity[user];
    }
    
    /**
     * @dev 获取所有交易对数量
     */
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
}