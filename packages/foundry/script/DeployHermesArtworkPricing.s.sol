// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "../contracts/HermesArtworkPricing.sol";

/**
 * @title Deploy HermesArtworkPricing
 * @notice Deployment script for the Hermes Artwork Pricing contract
 * @dev Run with: forge script script/DeployHermesArtworkPricing.s.sol:DeployHermesArtworkPricing --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast --verify
 */
contract DeployHermesArtworkPricing is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the HermesArtworkPricing contract
        HermesArtworkPricing artworkPricing = new HermesArtworkPricing();
        
        console.log("HermesArtworkPricing deployed at:", address(artworkPricing));
        
        // Create some sample artworks for demonstration
        uint256 artwork1 = artworkPricing.createArtwork(
            "Ethereum Genesis",
            "Hermes AI",
            50000000000 // $500.00 USD (8 decimals: 500 * 10^8)
        );
        
        uint256 artwork2 = artworkPricing.createArtwork(
            "Base Harmony",
            "Hermes AI", 
            25000000000 // $250.00 USD (8 decimals: 250 * 10^8)
        );
        
        uint256 artwork3 = artworkPricing.createArtwork(
            "Bitcoin Symphony",
            "Hermes AI",
            100000000000 // $1000.00 USD (8 decimals: 1000 * 10^8)
        );
        
        console.log("Sample artwork 1 created with ID:", artwork1);
        console.log("Sample artwork 2 created with ID:", artwork2);
        console.log("Sample artwork 3 created with ID:", artwork3);
        
        // Log deployment information
        console.log("Deployment completed successfully!");
        console.log("Contract owner:", artworkPricing.owner());
        console.log("Next artwork ID:", artworkPricing.nextArtworkId());
        
        // Display supported chains
        string[] memory supportedChains = artworkPricing.getSupportedChains();
        console.log("Supported chains:");
        for (uint256 i = 0; i < supportedChains.length; i++) {
            console.log("-", supportedChains[i]);
        }
        
        vm.stopBroadcast();
    }
}
