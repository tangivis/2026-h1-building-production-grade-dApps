// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
    
    // 方便测试，允许任何人铸造代币
    function mint(address to, uint256 amount) public {
        _mint(to, amount * 10 ** decimals());
    }
}