// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@redstone-finance/evm-connector/core/RedstoneConsumerNumericBase.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HermesArtworkPricing
 * @author Hermes Team
 * @notice Smart contract for calculating artwork prices based on blockchain native token prices using RedStone Oracle
 * @dev This contract uses RedStone Oracle to fetch real-time prices of native tokens and calculate artwork prices
 */
contract HermesArtworkPricing is RedstoneConsumerNumericBase, Ownable, ReentrancyGuard {
    
    // Events
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
    
    // Structs
    struct ArtworkInfo {
        uint256 id;
        string title;
        string artist;
        uint256 basePriceUSD; // Price in USD with 8 decimal places (same as RedStone)
        bool isActive;
        uint256 createdAt;
        uint256 lastPriceUpdate;
    }
    
    struct PriceCalculation {
        uint256 artworkId;
        string chainName;
        uint256 basePriceUSD;
        uint256 nativeTokenPriceUSD;
        uint256 finalPriceInNativeToken;
        uint256 timestamp;
    }
    
    // State variables
    mapping(uint256 => ArtworkInfo) public artworks;
    mapping(string => bytes32) public chainToTokenMapping; // chain name -> RedStone data feed ID
    mapping(uint256 => PriceCalculation) public lastPriceCalculations;
    
    uint256 public nextArtworkId = 1;
    uint256 public constant PRICE_DECIMALS = 8; // RedStone uses 8 decimals
    uint256 public constant NATIVE_TOKEN_DECIMALS = 18; // Most native tokens use 18 decimals
    
    // RedStone configuration
    string public constant DATA_SERVICE_ID = "redstone-main-demo";
    uint8 public constant UNIQUE_SIGNERS_THRESHOLD = 1;
    address public constant AUTHORISED_SIGNER = 0x0C39486f770B26F5527BBBf942726537986Cd7eb;
    
    constructor() Ownable(msg.sender) {
        // Initialize common chain-to-token mappings
        _initializeChainMappings();
    }
    
    /**
     * @notice Initialize common blockchain to token mappings
     */
    function _initializeChainMappings() private {
        chainToTokenMapping["ethereum"] = bytes32("ETH");
        chainToTokenMapping["bitcoin"] = bytes32("BTC");
        chainToTokenMapping["polygon"] = bytes32("MATIC");
        chainToTokenMapping["arbitrum"] = bytes32("ETH");
        chainToTokenMapping["optimism"] = bytes32("ETH");
        chainToTokenMapping["base"] = bytes32("ETH");
        chainToTokenMapping["avalanche"] = bytes32("AVAX");
        chainToTokenMapping["binance"] = bytes32("BNB");
        chainToTokenMapping["solana"] = bytes32("SOL");
    }
    
    /**
     * @notice Create a new artwork with base price in USD
     * @param title The title of the artwork
     * @param artist The artist name
     * @param basePriceUSD Base price in USD (8 decimal places)
     */
    function createArtwork(
        string memory title,
        string memory artist,
        uint256 basePriceUSD
    ) external onlyOwner returns (uint256 artworkId) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(artist).length > 0, "Artist cannot be empty");
        require(basePriceUSD > 0, "Base price must be greater than 0");
        
        artworkId = nextArtworkId++;
        
        artworks[artworkId] = ArtworkInfo({
            id: artworkId,
            title: title,
            artist: artist,
            basePriceUSD: basePriceUSD,
            isActive: true,
            createdAt: block.timestamp,
            lastPriceUpdate: 0
        });
        
        return artworkId;
    }
    
    /**
     * @notice Calculate artwork price in native token for a specific blockchain
     * @param artworkId The ID of the artwork
     * @param chainName The name of the blockchain (e.g., "ethereum", "base")
     * @return priceInNativeToken The calculated price in native token (18 decimals)
     */
    function calculateArtworkPrice(
        uint256 artworkId,
        string memory chainName
    ) external view returns (uint256 priceInNativeToken) {
        require(artworks[artworkId].isActive, "Artwork not found or inactive");
        
        bytes32 tokenDataFeedId = chainToTokenMapping[chainName];
        require(tokenDataFeedId != bytes32(0), "Chain not supported");
        
        // Get native token price from RedStone Oracle
        uint256 nativeTokenPriceUSD = getOracleNumericValueFromTxMsg(tokenDataFeedId);
        require(nativeTokenPriceUSD > 0, "Invalid token price");
        
        uint256 basePriceUSD = artworks[artworkId].basePriceUSD;
        
        // Calculate price in native token
        // Formula: (basePriceUSD * 10^18) / nativeTokenPriceUSD
        // Both prices have 8 decimals, result should have 18 decimals for native token
        priceInNativeToken = (basePriceUSD * (10 ** NATIVE_TOKEN_DECIMALS)) / nativeTokenPriceUSD;
        
        return priceInNativeToken;
    }
    
    /**
     * @notice Calculate and store artwork price calculation for future reference
     * @param artworkId The ID of the artwork
     * @param chainName The name of the blockchain
     * @return priceInNativeToken The calculated price in native token
     */
    function calculateAndStoreArtworkPrice(
        uint256 artworkId,
        string memory chainName
    ) external nonReentrant returns (uint256 priceInNativeToken) {
        require(artworks[artworkId].isActive, "Artwork not found or inactive");
        
        bytes32 tokenDataFeedId = chainToTokenMapping[chainName];
        require(tokenDataFeedId != bytes32(0), "Chain not supported");
        
        // Get native token price from RedStone Oracle
        uint256 nativeTokenPriceUSD = getOracleNumericValueFromTxMsg(tokenDataFeedId);
        require(nativeTokenPriceUSD > 0, "Invalid token price");
        
        uint256 basePriceUSD = artworks[artworkId].basePriceUSD;
        
        // Calculate price in native token
        priceInNativeToken = (basePriceUSD * (10 ** NATIVE_TOKEN_DECIMALS)) / nativeTokenPriceUSD;
        
        // Store calculation
        lastPriceCalculations[artworkId] = PriceCalculation({
            artworkId: artworkId,
            chainName: chainName,
            basePriceUSD: basePriceUSD,
            nativeTokenPriceUSD: nativeTokenPriceUSD,
            finalPriceInNativeToken: priceInNativeToken,
            timestamp: block.timestamp
        });
        
        // Update artwork's last price update timestamp
        artworks[artworkId].lastPriceUpdate = block.timestamp;
        
        emit ArtworkPriceCalculated(
            artworkId,
            chainName,
            basePriceUSD,
            nativeTokenPriceUSD,
            priceInNativeToken,
            block.timestamp
        );
        
        return priceInNativeToken;
    }
    
    /**
     * @notice Get current native token price for a specific chain
     * @param chainName The name of the blockchain
     * @return tokenPriceUSD The current token price in USD (8 decimals)
     */
    function getCurrentTokenPrice(string memory chainName) 
        external 
        view 
        returns (uint256 tokenPriceUSD) 
    {
        bytes32 tokenDataFeedId = chainToTokenMapping[chainName];
        require(tokenDataFeedId != bytes32(0), "Chain not supported");
        
        tokenPriceUSD = getOracleNumericValueFromTxMsg(tokenDataFeedId);
        require(tokenPriceUSD > 0, "Invalid token price");
        
        return tokenPriceUSD;
    }
    
    /**
     * @notice Update base price for an artwork
     * @param artworkId The ID of the artwork
     * @param newBasePriceUSD New base price in USD (8 decimals)
     */
    function updateArtworkBasePrice(uint256 artworkId, uint256 newBasePriceUSD) 
        external 
        onlyOwner 
    {
        require(artworks[artworkId].id != 0, "Artwork not found");
        require(newBasePriceUSD > 0, "Base price must be greater than 0");
        
        uint256 oldPrice = artworks[artworkId].basePriceUSD;
        artworks[artworkId].basePriceUSD = newBasePriceUSD;
        
        emit BasePriceUpdated(artworkId, oldPrice, newBasePriceUSD);
    }
    
    /**
     * @notice Add or update chain to token mapping
     * @param chainName The name of the blockchain
     * @param tokenDataFeedId The RedStone data feed ID for the token
     */
    function updateChainTokenMapping(string memory chainName, bytes32 tokenDataFeedId) 
        external 
        onlyOwner 
    {
        require(bytes(chainName).length > 0, "Chain name cannot be empty");
        require(tokenDataFeedId != bytes32(0), "Token data feed ID cannot be empty");
        
        bytes32 oldTokenId = chainToTokenMapping[chainName];
        chainToTokenMapping[chainName] = tokenDataFeedId;
        
        emit ChainTokenMappingUpdated(chainName, oldTokenId, tokenDataFeedId);
    }
    
    /**
     * @notice Toggle artwork active status
     * @param artworkId The ID of the artwork
     */
    function toggleArtworkStatus(uint256 artworkId) external onlyOwner {
        require(artworks[artworkId].id != 0, "Artwork not found");
        artworks[artworkId].isActive = !artworks[artworkId].isActive;
    }
    
    /**
     * @notice Get artwork information
     * @param artworkId The ID of the artwork
     * @return artwork The artwork information
     */
    function getArtwork(uint256 artworkId) external view returns (ArtworkInfo memory artwork) {
        require(artworks[artworkId].id != 0, "Artwork not found");
        return artworks[artworkId];
    }
    
    /**
     * @notice Get last price calculation for an artwork
     * @param artworkId The ID of the artwork
     * @return calculation The last price calculation
     */
    function getLastPriceCalculation(uint256 artworkId) 
        external 
        view 
        returns (PriceCalculation memory calculation) 
    {
        return lastPriceCalculations[artworkId];
    }
    
    /**
     * @notice Get supported chains
     * @return chains Array of supported chain names
     */
    function getSupportedChains() external pure returns (string[] memory chains) {
        chains = new string[](9);
        chains[0] = "ethereum";
        chains[1] = "bitcoin";
        chains[2] = "polygon";
        chains[3] = "arbitrum";
        chains[4] = "optimism";
        chains[5] = "base";
        chains[6] = "avalanche";
        chains[7] = "binance";
        chains[8] = "solana";
        return chains;
    }
    
    // RedStone Oracle required functions
    function getDataServiceId() public view virtual override returns (string memory) {
        return DATA_SERVICE_ID;
    }
    
    function getUniqueSignersThreshold() public view virtual override returns (uint8) {
        return UNIQUE_SIGNERS_THRESHOLD;
    }
    
    function getAuthorisedSignerIndex(address signerAddress)
        public
        view
        virtual
        override
        returns (uint8)
    {
        if (signerAddress == AUTHORISED_SIGNER) {
            return 0;
        } else {
            revert SignerNotAuthorised(signerAddress);
        }
    }
}
