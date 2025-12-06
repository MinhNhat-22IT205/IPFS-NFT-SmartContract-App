// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract IPFSStorage {
    string public cid;
    address public owner;

    event CIDUpdated(string newCid, address indexed by);

    constructor() {
        owner = msg.sender;
    }

    function setCID(string memory _cid) external {
        require(msg.sender == owner || owner == address(0), "Not authorized");
        cid = _cid;
        emit CIDUpdated(_cid, msg.sender);
    }

    function getCID() external view returns (string memory) {
        return cid;
    }
}
