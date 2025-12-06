// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract IPFSNFT is ERC721 {
    uint256 private _tokenIds;

    // Lưu CID của mỗi tokenId → metadata JSON trên IPFS
    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("My IPFS NFT", "IPFSNFT") {}

    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function mintNFT(string memory _cid) external returns (uint256) {
        _tokenIds++;
        uint256 newId = _tokenIds;

        _safeMint(msg.sender, newId);

        // Lưu link metadata: ipfs://_cid
        _tokenURIs[newId] = string(abi.encodePacked("ipfs://", _cid));

        return newId;
    }
}
