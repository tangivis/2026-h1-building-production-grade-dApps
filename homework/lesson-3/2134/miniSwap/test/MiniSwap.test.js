const { expect } = require("chai");
const hre = require("hardhat");

describe("MiniSwap", function () {
  let miniSwap;
  let tokenA, tokenB, tokenC;
  let owner;
  const INITIAL_SUPPLY = hre.ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner] = await hre.ethers.getSigners();

    // Deploy tokens
    const ERC20Token = await hre.ethers.getContractFactory("ERC20Token");
    tokenA = await ERC20Token.deploy("Token A", "TKA", INITIAL_SUPPLY);
    tokenB = await ERC20Token.deploy("Token B", "TKB", INITIAL_SUPPLY);
    tokenC = await ERC20Token.deploy("Token C", "TKC", INITIAL_SUPPLY);

    // Deploy MiniSwap
    const MiniSwap = await hre.ethers.getContractFactory("MiniSwap");
    miniSwap = await MiniSwap.deploy();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await miniSwap.poolReserves(await tokenA.getAddress(), await tokenB.getAddress())).to.equal(0);
    });
  });

  describe("Add Liquidity", function () {
    it("Should add liquidity correctly", async function () {
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();
      const amount = hre.ethers.parseEther("100");

      // Approve tokens
      await tokenA.approve(await miniSwap.getAddress(), amount);
      await tokenB.approve(await miniSwap.getAddress(), amount);

      // Add liquidity
      await miniSwap.addLiquidity(tokenAAddress, tokenBAddress, amount);

      // Check liquidity
      const liquidity = await miniSwap.getLiquidity(tokenAAddress, tokenBAddress, owner.address);
      expect(liquidity).to.equal(amount);

      // Check pool reserves
      const reserves = await miniSwap.getPoolReserves(tokenAAddress, tokenBAddress);
      expect(reserves).to.equal(amount);
    });

    it("Should fail when adding liquidity with zero amount", async function () {
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();

      await expect(
        miniSwap.addLiquidity(tokenAAddress, tokenBAddress, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should fail when adding liquidity for same token", async function () {
      const tokenAAddress = await tokenA.getAddress();
      const amount = hre.ethers.parseEther("100");

      await expect(
        miniSwap.addLiquidity(tokenAAddress, tokenAAddress, amount)
      ).to.be.revertedWith("Cannot create pair with same token");
    });
  });

  describe("Remove Liquidity", function () {
    beforeEach(async function () {
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();
      const amount = hre.ethers.parseEther("100");

      await tokenA.approve(await miniSwap.getAddress(), amount);
      await tokenB.approve(await miniSwap.getAddress(), amount);
      await miniSwap.addLiquidity(tokenAAddress, tokenBAddress, amount);
    });

    it("Should remove liquidity correctly", async function () {
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();
      const removeAmount = hre.ethers.parseEther("50");

      // Initial balances
      const initialBalanceA = await tokenA.balanceOf(owner.address);
      const initialBalanceB = await tokenB.balanceOf(owner.address);

      await miniSwap.removeLiquidity(tokenAAddress, tokenBAddress, removeAmount);

      // Check final balances
      const finalBalanceA = await tokenA.balanceOf(owner.address);
      const finalBalanceB = await tokenB.balanceOf(owner.address);

      expect(finalBalanceA - initialBalanceA).to.equal(removeAmount);
      expect(finalBalanceB - initialBalanceB).to.equal(removeAmount);

      // Check remaining liquidity
      const liquidity = await miniSwap.getLiquidity(tokenAAddress, tokenBAddress, owner.address);
      expect(liquidity).to.equal(hre.ethers.parseEther("50"));
    });

    it("Should fail when removing more liquidity than owned", async function () {
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();
      const removeAmount = hre.ethers.parseEther("200");

      await expect(
        miniSwap.removeLiquidity(tokenAAddress, tokenBAddress, removeAmount)
      ).to.be.revertedWith("Insufficient liquidity");
    });
  });

  describe("Swap", function () {
    it("Should swap tokens at 1:1 ratio", async function () {
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();
      const liquidityAmount = hre.ethers.parseEther("1000");
      const swapAmount = hre.ethers.parseEther("10");

      // Add liquidity first
      await tokenA.approve(await miniSwap.getAddress(), liquidityAmount);
      await tokenB.approve(await miniSwap.getAddress(), liquidityAmount);
      await miniSwap.addLiquidity(tokenAAddress, tokenBAddress, liquidityAmount);

      // Record balances before swap
      const balanceABefore = await tokenA.balanceOf(owner.address);
      const balanceBBefore = await tokenB.balanceOf(owner.address);

      // Approve and swap
      await tokenA.approve(await miniSwap.getAddress(), swapAmount);
      await miniSwap.swap(tokenAAddress, tokenBAddress, swapAmount);

      // Check balances after swap
      const balanceAAfter = await tokenA.balanceOf(owner.address);
      const balanceBAfter = await tokenB.balanceOf(owner.address);

      // TokenA should decrease by swapAmount, TokenB should increase by swapAmount
      expect(balanceABefore - balanceAAfter).to.equal(swapAmount);
      expect(balanceBAfter - balanceBBefore).to.equal(swapAmount);
    });

    it("Should fail when swapping same token", async function () {
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();
      const swapAmount = hre.ethers.parseEther("10");

      // Add liquidity first
      await tokenA.approve(await miniSwap.getAddress(), swapAmount);
      await tokenB.approve(await miniSwap.getAddress(), swapAmount);
      await miniSwap.addLiquidity(tokenAAddress, tokenBAddress, swapAmount);

      await expect(
        miniSwap.swap(tokenAAddress, tokenAAddress, swapAmount)
      ).to.be.revertedWith("Cannot swap same token");
    });

    it("Should fail when swapping with zero amount", async function () {
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();

      await expect(
        miniSwap.swap(tokenAAddress, tokenBAddress, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Multiple Pairs", function () {
    it("Should handle multiple trading pairs independently", async function () {
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();
      const tokenCAddress = await tokenC.getAddress();

      const amount1 = hre.ethers.parseEther("100");
      const amount2 = hre.ethers.parseEther("200");

      // Add liquidity to A-B pair
      await tokenA.approve(await miniSwap.getAddress(), amount1);
      await tokenB.approve(await miniSwap.getAddress(), amount1);
      await miniSwap.addLiquidity(tokenAAddress, tokenBAddress, amount1);

      // Add liquidity to A-C pair
      await tokenA.approve(await miniSwap.getAddress(), amount2);
      await tokenC.approve(await miniSwap.getAddress(), amount2);
      await miniSwap.addLiquidity(tokenAAddress, tokenCAddress, amount2);

      // Check liquidity for both pairs
      const liquidityAB = await miniSwap.getLiquidity(tokenAAddress, tokenBAddress, owner.address);
      const liquidityAC = await miniSwap.getLiquidity(tokenAAddress, tokenCAddress, owner.address);

      expect(liquidityAB).to.equal(amount1);
      expect(liquidityAC).to.equal(amount2);
    });
  });
});
