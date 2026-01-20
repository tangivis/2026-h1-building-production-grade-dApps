// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract UUPSBoxV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 public value;
    string public name;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 _value) public initializer {
        __Ownable_init(msg.sender);
        value = _value;
        name = "UUPS_Box";
    }

    function getValue() public view returns (uint256) {
        return value;
    }

    function setValue(uint256 _value) public {
        value = _value;
    }

    function version() public pure virtual returns (string memory) {
        return "V1";
    }

    // 必须实现此函数以授权升级
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
