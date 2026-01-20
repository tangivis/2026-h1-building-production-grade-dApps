// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "./UUPSBoxV1.sol";

contract UUPSBoxV2 is UUPSBoxV1 {
    uint256 public lastUpgradeTime; // 新增变量，追加在末尾
    // 新增功能：增加数值
    function increment() public {
        value += 1;
    }

    function version() public pure override returns (string memory) {
        return "V2";
    }

    // 新增功能：更新升级时间
    function setUpgradeTime() public {
        lastUpgradeTime = block.timestamp;
    }
}
