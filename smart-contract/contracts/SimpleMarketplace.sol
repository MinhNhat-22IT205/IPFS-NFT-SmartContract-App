// contracts/SimpleMarketplace.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SimpleMarketplace {
    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    Listing[] public listings;
    mapping(uint256 => uint256) public listingIndex;

    event Listed(uint256 indexed listingId, address seller, uint256 price);
    event Sold(uint256 indexed listingId, address buyer, uint256 price);
    event Cancelled(uint256 indexed listingId);

    function listForSale(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external {
        require(price > 0, "Price must be > 0");

        // Transfer NFT to marketplace
        (bool success, ) = nftContract.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender,
                address(this),
                tokenId
            )
        );
        require(success, "Transfer failed");

        uint256 listingId = listings.length;
        listings.push(
            Listing(listingId, msg.sender, nftContract, tokenId, price, true)
        );
        listingIndex[tokenId] = listingId;

        emit Listed(listingId, msg.sender, price);
    }

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Not active");
        require(listing.seller == msg.sender, "Not owner");

        listing.active = false;
        (bool success, ) = listing.nftContract.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                address(this),
                msg.sender,
                listing.tokenId
            )
        );
        require(success, "Transfer back failed");

        emit Cancelled(listingId);
    }

    function buy(uint256 listingId) external payable {
        Listing storage listing = listings[listingId];
        require(listing.active, "Not for sale");
        require(msg.value >= listing.price, "Not enough ETH");

        listing.active = false;

        // Transfer NFT to buyer
        (bool success1, ) = listing.nftContract.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                address(this),
                msg.sender,
                listing.tokenId
            )
        );
        require(success1, "NFT transfer failed");

        // Transfer ETH to seller
        payable(listing.seller).transfer(listing.price);

        // Refund excess ETH
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit Sold(listingId, msg.sender, listing.price);
    }

    function getActiveListings() external view returns (Listing[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < listings.length; i++) {
            if (listings[i].active) count++;
        }

        Listing[] memory active = new Listing[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < listings.length; i++) {
            if (listings[i].active) {
                active[index] = listings[i];
                index++;
            }
        }
        return active;
    }
}
