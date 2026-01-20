//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ERC20Token.sol";

/**
 * @title MiniSwap
 * @notice A simplified DEX implementation for learning purposes
 * @dev Simplifications:
 *      - 1:1 exchange ratio between all tokens
 *      - No trading fees
 *      - No liquidity provider rewards
 *
 * Liquidity Management:
 *      - LP tokens represent ownership in the liquidity pool
 *      - LP tokens are minted when liquidity is added
 *      - LP tokens are burned when liquidity is removed
 *      - LP tokens for a pair (tokenA, tokenB) are unique to that pair
 */
contract MiniSwap {
    // Mapping to track liquidity positions: (tokenA, tokenB) => (user => amount)
    mapping(address => mapping(address => mapping(address => uint256))) public liquidity;

    // Mapping to track total liquidity in each pool: (tokenA, tokenB) => total amount
    mapping(address => mapping(address => uint256)) public poolReserves;

    // Events
    event AddLiquidity(address indexed user, address indexed tokenA, address indexed tokenB, uint256 amount);
    event RemoveLiquidity(address indexed user, address indexed tokenA, address indexed tokenB, uint256 amount);
    event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    /**
     * @notice Add liquidity to a token pair
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param amount Amount of each token to add (1:1 ratio required)
     * @dev User must approve both tokens before calling this function
     */
    function addLiquidity(address tokenA, address tokenB, uint256 amount) external {
        require(tokenA != address(0) && tokenB != address(0), "Invalid token address");
        require(tokenA != tokenB, "Cannot create pair with same token");
        require(amount > 0, "Amount must be greater than 0");

        IERC20(tokenA).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amount);

        // Mint LP tokens to the user
        liquidity[tokenA][tokenB][msg.sender] += amount;
        poolReserves[tokenA][tokenB] += amount;

        emit AddLiquidity(msg.sender, tokenA, tokenB, amount);
    }

    /**
     * @notice Remove liquidity from a token pair
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param amount Amount of LP tokens to burn (will receive amount of each token back)
     */
    function removeLiquidity(address tokenA, address tokenB, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        uint256 userLiquidity = liquidity[tokenA][tokenB][msg.sender];
        require(userLiquidity >= amount, "Insufficient liquidity");

        // Burn LP tokens
        liquidity[tokenA][tokenB][msg.sender] -= amount;
        poolReserves[tokenA][tokenB] -= amount;

        // Transfer tokens back to user (1:1 ratio)
        IERC20(tokenA).transfer(msg.sender, amount);
        IERC20(tokenB).transfer(msg.sender, amount);

        emit RemoveLiquidity(msg.sender, tokenA, tokenB, amount);
    }

    /**
     * @notice Swap tokens at 1:1 ratio
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amount Amount of input tokens to swap
     * @dev Simplified: 1:1 exchange ratio, no fees, no slippage protection
     */
    function swap(address tokenIn, address tokenOut, uint256 amount) external {
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid token address");
        require(tokenIn != tokenOut, "Cannot swap same token");
        require(amount > 0, "Amount must be greater than 0");

        // Transfer input tokens from user
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amount);

        // Transfer output tokens to user (1:1 ratio)
        IERC20(tokenOut).transfer(msg.sender, amount);

        emit Swap(msg.sender, tokenIn, tokenOut, amount, amount);
    }

    /**
     * @notice Get user's liquidity balance for a token pair
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param user User address
     * @return Amount of LP tokens the user holds
     */
    function getLiquidity(address tokenA, address tokenB, address user) external view returns (uint256) {
        return liquidity[tokenA][tokenB][user];
    }

    /**
     * @notice Get the total reserves in a pool
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return Total amount of reserves in the pool
     */
    function getPoolReserves(address tokenA, address tokenB) external view returns (uint256) {
        return poolReserves[tokenA][tokenB];
    }
}
