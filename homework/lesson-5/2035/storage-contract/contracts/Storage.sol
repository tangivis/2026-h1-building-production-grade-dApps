// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Storage {
    uint256 private _storedNumber;

    event NumberStored(uint256 newNumber);

    function setNumber(uint256 _number) public {
        _storedNumber = _number;
        emit NumberStored(_number);
    }

    function storedNumber() public view returns (uint256) {
        return _storedNumber;
    }
}
