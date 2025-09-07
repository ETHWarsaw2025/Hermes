// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "../contracts/HermesArtworkPricing.sol";

/**
 * @title HermesArtworkPricing Test Suite
 * @notice Comprehensive tests for the Hermes Artwork Pricing contract
 * @dev Tests the RedStone Oracle integration and artwork pricing functionality
 */
contract HermesArtworkPricingTest is Test {
    HermesArtworkPricing public artworkPricing;
    
    address public owner;
    address public user1;
    address public user2;
    
    // Test constants
    uint256 constant SAMPLE_BASE_PRICE = 50000000000; // $500.00 USD (8 decimals)
    uint256 constant ETH_PRICE_USD = 200000000000; // $2000.00 USD (8 decimals)
    uint256 constant BTC_PRICE_USD = 4000000000000; // $40000.00 USD (8 decimals)
    
    event ArtworkPriceCalculated(
        uint256 indexed artworkId,
        string indexed chainName,
        uint256 basePriceUSD,
        uint256 nativeTokenPrice,
        uint256 finalPriceInNativeToken,
        uint256 timestamp
    );
    
    event BasePriceUpdated(uint256 indexed artworkId, uint256 oldPrice, uint256 newPrice);
    
    event ChainTokenMappingUpdated(string indexed chainName, bytes32 oldTokenId, bytes32 newTokenId);
    
    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        vm.startPrank(owner);
        artworkPricing = new HermesArtworkPricing();
        vm.stopPrank();
    }
    
    function test_InitialState() public view {
        assertEq(artworkPricing.owner(), owner);
        assertEq(artworkPricing.nextArtworkId(), 1);
        assertEq(artworkPricing.PRICE_DECIMALS(), 8);
        assertEq(artworkPricing.NATIVE_TOKEN_DECIMALS(), 18);
        assertEq(artworkPricing.DATA_SERVICE_ID(), "redstone-main-demo");
        assertEq(artworkPricing.UNIQUE_SIGNERS_THRESHOLD(), 1);
        assertEq(artworkPricing.AUTHORISED_SIGNER(), 0x0C39486f770B26F5527BBBf942726537986Cd7eb);
    }
    
    function test_InitialChainMappings() public view {
        assertEq(artworkPricing.chainToTokenMapping("ethereum"), bytes32("ETH"));
        assertEq(artworkPricing.chainToTokenMapping("bitcoin"), bytes32("BTC"));
        assertEq(artworkPricing.chainToTokenMapping("polygon"), bytes32("MATIC"));
        assertEq(artworkPricing.chainToTokenMapping("arbitrum"), bytes32("ETH"));
        assertEq(artworkPricing.chainToTokenMapping("optimism"), bytes32("ETH"));
        assertEq(artworkPricing.chainToTokenMapping("base"), bytes32("ETH"));
        assertEq(artworkPricing.chainToTokenMapping("avalanche"), bytes32("AVAX"));
        assertEq(artworkPricing.chainToTokenMapping("binance"), bytes32("BNB"));
        assertEq(artworkPricing.chainToTokenMapping("solana"), bytes32("SOL"));
    }
    
    function test_CreateArtwork() public {
        vm.prank(owner);
        uint256 artworkId = artworkPricing.createArtwork(
            "Test Artwork",
            "Test Artist",
            SAMPLE_BASE_PRICE
        );
        
        assertEq(artworkId, 1);
        assertEq(artworkPricing.nextArtworkId(), 2);
        
        HermesArtworkPricing.ArtworkInfo memory artwork = artworkPricing.getArtwork(artworkId);
        assertEq(artwork.id, artworkId);
        assertEq(artwork.title, "Test Artwork");
        assertEq(artwork.artist, "Test Artist");
        assertEq(artwork.basePriceUSD, SAMPLE_BASE_PRICE);
        assertTrue(artwork.isActive);
        assertEq(artwork.createdAt, block.timestamp);
        assertEq(artwork.lastPriceUpdate, 0);
    }
    
    function test_CreateArtwork_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        artworkPricing.createArtwork("Test", "Artist", SAMPLE_BASE_PRICE);
    }
    
    function test_CreateArtwork_InvalidInputs() public {
        vm.startPrank(owner);
        
        // Empty title
        vm.expectRevert("Title cannot be empty");
        artworkPricing.createArtwork("", "Artist", SAMPLE_BASE_PRICE);
        
        // Empty artist
        vm.expectRevert("Artist cannot be empty");
        artworkPricing.createArtwork("Title", "", SAMPLE_BASE_PRICE);
        
        // Zero price
        vm.expectRevert("Base price must be greater than 0");
        artworkPricing.createArtwork("Title", "Artist", 0);
        
        vm.stopPrank();
    }
    
    function test_UpdateArtworkBasePrice() public {
        vm.prank(owner);
        uint256 artworkId = artworkPricing.createArtwork("Test", "Artist", SAMPLE_BASE_PRICE);
        
        uint256 newPrice = 75000000000; // $750.00 USD
        
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit BasePriceUpdated(artworkId, SAMPLE_BASE_PRICE, newPrice);
        artworkPricing.updateArtworkBasePrice(artworkId, newPrice);
        
        HermesArtworkPricing.ArtworkInfo memory artwork = artworkPricing.getArtwork(artworkId);
        assertEq(artwork.basePriceUSD, newPrice);
    }
    
    function test_UpdateArtworkBasePrice_OnlyOwner() public {
        vm.prank(owner);
        uint256 artworkId = artworkPricing.createArtwork("Test", "Artist", SAMPLE_BASE_PRICE);
        
        vm.prank(user1);
        vm.expectRevert();
        artworkPricing.updateArtworkBasePrice(artworkId, 100000000000);
    }
    
    function test_UpdateArtworkBasePrice_InvalidInputs() public {
        vm.prank(owner);
        uint256 artworkId = artworkPricing.createArtwork("Test", "Artist", SAMPLE_BASE_PRICE);
        
        vm.startPrank(owner);
        
        // Non-existent artwork
        vm.expectRevert("Artwork not found");
        artworkPricing.updateArtworkBasePrice(999, 100000000000);
        
        // Zero price
        vm.expectRevert("Base price must be greater than 0");
        artworkPricing.updateArtworkBasePrice(artworkId, 0);
        
        vm.stopPrank();
    }
    
    function test_UpdateChainTokenMapping() public {
        bytes32 newTokenId = bytes32("NEWTOKEN");
        
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit ChainTokenMappingUpdated("ethereum", bytes32("ETH"), newTokenId);
        artworkPricing.updateChainTokenMapping("ethereum", newTokenId);
        
        assertEq(artworkPricing.chainToTokenMapping("ethereum"), newTokenId);
    }
    
    function test_UpdateChainTokenMapping_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        artworkPricing.updateChainTokenMapping("ethereum", bytes32("NEWTOKEN"));
    }
    
    function test_UpdateChainTokenMapping_InvalidInputs() public {
        vm.startPrank(owner);
        
        // Empty chain name
        vm.expectRevert("Chain name cannot be empty");
        artworkPricing.updateChainTokenMapping("", bytes32("TOKEN"));
        
        // Empty token ID
        vm.expectRevert("Token data feed ID cannot be empty");
        artworkPricing.updateChainTokenMapping("ethereum", bytes32(0));
        
        vm.stopPrank();
    }
    
    function test_ToggleArtworkStatus() public {
        vm.prank(owner);
        uint256 artworkId = artworkPricing.createArtwork("Test", "Artist", SAMPLE_BASE_PRICE);
        
        // Initially active
        assertTrue(artworkPricing.getArtwork(artworkId).isActive);
        
        // Toggle to inactive
        vm.prank(owner);
        artworkPricing.toggleArtworkStatus(artworkId);
        assertFalse(artworkPricing.getArtwork(artworkId).isActive);
        
        // Toggle back to active
        vm.prank(owner);
        artworkPricing.toggleArtworkStatus(artworkId);
        assertTrue(artworkPricing.getArtwork(artworkId).isActive);
    }
    
    function test_ToggleArtworkStatus_OnlyOwner() public {
        vm.prank(owner);
        uint256 artworkId = artworkPricing.createArtwork("Test", "Artist", SAMPLE_BASE_PRICE);
        
        vm.prank(user1);
        vm.expectRevert();
        artworkPricing.toggleArtworkStatus(artworkId);
    }
    
    function test_ToggleArtworkStatus_NonExistentArtwork() public {
        vm.prank(owner);
        vm.expectRevert("Artwork not found");
        artworkPricing.toggleArtworkStatus(999);
    }
    
    function test_GetArtwork_NonExistent() public {
        vm.expectRevert("Artwork not found");
        artworkPricing.getArtwork(999);
    }
    
    function test_GetSupportedChains() public view {
        string[] memory chains = artworkPricing.getSupportedChains();
        assertEq(chains.length, 9);
        assertEq(chains[0], "ethereum");
        assertEq(chains[1], "bitcoin");
        assertEq(chains[2], "polygon");
        assertEq(chains[3], "arbitrum");
        assertEq(chains[4], "optimism");
        assertEq(chains[5], "base");
        assertEq(chains[6], "avalanche");
        assertEq(chains[7], "binance");
        assertEq(chains[8], "solana");
    }
    
    function test_RedstoneOracleConfiguration() public view {
        assertEq(artworkPricing.getDataServiceId(), "redstone-main-demo");
        assertEq(artworkPricing.getUniqueSignersThreshold(), 1);
        assertEq(artworkPricing.getAuthorisedSignerIndex(0x0C39486f770B26F5527BBBf942726537986Cd7eb), 0);
    }
    
    function test_RedstoneOracle_UnauthorizedSigner() public {
        vm.expectRevert();
        artworkPricing.getAuthorisedSignerIndex(user1);
    }
    
    // Note: The following tests would require RedStone payload in calldata to work properly
    // In a real testing environment, you would need to mock the RedStone oracle calls
    // or use RedStone's testing utilities
    
    function test_CalculateArtworkPrice_UnsupportedChain() public {
        vm.prank(owner);
        uint256 artworkId = artworkPricing.createArtwork("Test", "Artist", SAMPLE_BASE_PRICE);
        
        vm.expectRevert("Chain not supported");
        artworkPricing.calculateArtworkPrice(artworkId, "unsupported_chain");
    }
    
    function test_CalculateArtworkPrice_InactiveArtwork() public {
        vm.prank(owner);
        uint256 artworkId = artworkPricing.createArtwork("Test", "Artist", SAMPLE_BASE_PRICE);
        
        vm.prank(owner);
        artworkPricing.toggleArtworkStatus(artworkId);
        
        vm.expectRevert("Artwork not found or inactive");
        artworkPricing.calculateArtworkPrice(artworkId, "ethereum");
    }
    
    function test_CalculateAndStoreArtworkPrice_UnsupportedChain() public {
        vm.prank(owner);
        uint256 artworkId = artworkPricing.createArtwork("Test", "Artist", SAMPLE_BASE_PRICE);
        
        vm.expectRevert("Chain not supported");
        artworkPricing.calculateAndStoreArtworkPrice(artworkId, "unsupported_chain");
    }
    
    function test_CalculateAndStoreArtworkPrice_InactiveArtwork() public {
        vm.prank(owner);
        uint256 artworkId = artworkPricing.createArtwork("Test", "Artist", SAMPLE_BASE_PRICE);
        
        vm.prank(owner);
        artworkPricing.toggleArtworkStatus(artworkId);
        
        vm.expectRevert("Artwork not found or inactive");
        artworkPricing.calculateAndStoreArtworkPrice(artworkId, "ethereum");
    }
    
    function test_GetCurrentTokenPrice_UnsupportedChain() public {
        vm.expectRevert("Chain not supported");
        artworkPricing.getCurrentTokenPrice("unsupported_chain");
    }
    
    // Fuzz testing
    function testFuzz_CreateArtwork(string memory title, string memory artist, uint256 basePrice) public {
        vm.assume(bytes(title).length > 0 && bytes(title).length < 100);
        vm.assume(bytes(artist).length > 0 && bytes(artist).length < 100);
        vm.assume(basePrice > 0 && basePrice < type(uint128).max);
        
        vm.prank(owner);
        uint256 artworkId = artworkPricing.createArtwork(title, artist, basePrice);
        
        HermesArtworkPricing.ArtworkInfo memory artwork = artworkPricing.getArtwork(artworkId);
        assertEq(artwork.title, title);
        assertEq(artwork.artist, artist);
        assertEq(artwork.basePriceUSD, basePrice);
    }
    
    function testFuzz_UpdateArtworkBasePrice(uint256 newPrice) public {
        vm.assume(newPrice > 0 && newPrice < type(uint128).max);
        
        vm.prank(owner);
        uint256 artworkId = artworkPricing.createArtwork("Test", "Artist", SAMPLE_BASE_PRICE);
        
        vm.prank(owner);
        artworkPricing.updateArtworkBasePrice(artworkId, newPrice);
        
        assertEq(artworkPricing.getArtwork(artworkId).basePriceUSD, newPrice);
    }
}
