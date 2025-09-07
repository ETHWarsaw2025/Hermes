# 🎨 Hermes Artwork Pricing Smart Contract

## Overview

The `HermesArtworkPricing` smart contract enables dynamic pricing of digital artworks based on real-time blockchain native token prices using [RedStone Oracle](https://redstone.finance/). This contract is designed to calculate artwork prices in native tokens (ETH, BTC, MATIC, etc.) based on USD base prices and current market rates.

## 🔗 RedStone Oracle Integration

This contract integrates with RedStone's decentralized oracle network to fetch real-time price data for various blockchain native tokens. RedStone provides:

- **Real-time Price Feeds**: Live market data for major cryptocurrencies
- **Decentralized Architecture**: Multiple data signers for reliability
- **Gas Efficiency**: Optimized for low-cost operations
- **Multi-chain Support**: Works across various EVM-compatible chains

### Supported Price Feeds

Based on [RedStone's available data sources](https://app.redstone.finance/app/sources/), the contract supports:

- **ETH** (Ethereum, Arbitrum, Optimism, Base)
- **BTC** (Bitcoin)
- **MATIC** (Polygon)
- **AVAX** (Avalanche)
- **BNB** (Binance Smart Chain)
- **SOL** (Solana)

## 🏗️ Contract Architecture

### Core Components

1. **Artwork Management**: Create, update, and manage digital artworks with USD base prices
2. **Price Calculation**: Dynamic conversion from USD to native tokens using RedStone prices
3. **Chain Support**: Multi-blockchain compatibility with chain-specific token mappings
4. **Access Control**: Owner-only functions for artwork and configuration management

### Key Features

- ✅ **Real-time Pricing**: Uses RedStone Oracle for up-to-date token prices
- ✅ **Multi-chain Support**: Works across 9+ blockchain networks
- ✅ **Flexible Pricing**: USD base prices converted to any supported native token
- ✅ **Price History**: Stores calculation history for tracking and analytics
- ✅ **Admin Controls**: Owner can update prices, mappings, and artwork status
- ✅ **Gas Optimized**: Efficient storage and calculation patterns

## 🚀 Usage Examples

### Deploy and Setup

```solidity
// Deploy the contract
HermesArtworkPricing artworkPricing = new HermesArtworkPricing();

// Create an artwork with $500 USD base price
uint256 artworkId = artworkPricing.createArtwork(
    "Ethereum Genesis", 
    "Hermes AI", 
    50000000000 // $500.00 USD (8 decimals)
);
```

### Calculate Artwork Price

```solidity
// Calculate price in ETH for Ethereum network
// Note: This requires RedStone payload in transaction calldata
uint256 priceInETH = artworkPricing.calculateArtworkPrice(
    artworkId, 
    "ethereum"
);

// Calculate and store price calculation
uint256 priceInETH = artworkPricing.calculateAndStoreArtworkPrice(
    artworkId, 
    "ethereum"
);
```

### Get Current Token Prices

```solidity
// Get current ETH price in USD (8 decimals)
uint256 ethPriceUSD = artworkPricing.getCurrentTokenPrice("ethereum");

// Get supported chains
string[] memory chains = artworkPricing.getSupportedChains();
```

## 🔧 Price Calculation Formula

The contract uses the following formula to convert USD prices to native tokens:

```
priceInNativeToken = (basePriceUSD × 10^18) / nativeTokenPriceUSD
```

**Example:**
- Artwork base price: $500.00 USD (50000000000 with 8 decimals)
- ETH price: $2000.00 USD (200000000000 with 8 decimals)  
- Result: 0.25 ETH (250000000000000000 with 18 decimals)

## 📊 Contract Functions

### Artwork Management

- `createArtwork(title, artist, basePriceUSD)` - Create new artwork
- `updateArtworkBasePrice(artworkId, newPrice)` - Update artwork price
- `toggleArtworkStatus(artworkId)` - Enable/disable artwork
- `getArtwork(artworkId)` - Get artwork information

### Price Calculation

- `calculateArtworkPrice(artworkId, chainName)` - Calculate price (view)
- `calculateAndStoreArtworkPrice(artworkId, chainName)` - Calculate and store
- `getCurrentTokenPrice(chainName)` - Get current token price
- `getLastPriceCalculation(artworkId)` - Get stored calculation

### Configuration

- `updateChainTokenMapping(chainName, tokenId)` - Add/update chain support
- `getSupportedChains()` - Get list of supported chains

## 🧪 Testing

The contract includes comprehensive tests covering:

- ✅ **Unit Tests**: All core functionality
- ✅ **Access Control**: Owner-only function protection  
- ✅ **Input Validation**: Edge cases and error conditions
- ✅ **Fuzz Testing**: Property-based testing with random inputs
- ✅ **Integration**: RedStone Oracle configuration

Run tests:
```bash
forge test -vv
```

## 🚀 Deployment

### Local Development

```bash
# Compile contracts
forge build

# Run tests  
forge test

# Deploy locally
forge script script/DeployHermesArtworkPricing.s.sol:DeployHermesArtworkPricing --rpc-url http://localhost:8545 --private-key <PRIVATE_KEY> --broadcast
```

### Mainnet Deployment

```bash
# Deploy to mainnet with verification
forge script script/DeployHermesArtworkPricing.s.sol:DeployHermesArtworkPricing \
  --rpc-url <MAINNET_RPC_URL> \
  --private-key <PRIVATE_KEY> \
  --broadcast \
  --verify
```

## 🔒 Security Considerations

1. **Oracle Dependency**: Contract relies on RedStone Oracle availability and accuracy
2. **Price Volatility**: Cryptocurrency prices can be highly volatile
3. **Access Control**: Only owner can modify artworks and configurations
4. **Reentrancy Protection**: Uses OpenZeppelin's ReentrancyGuard
5. **Input Validation**: Comprehensive checks for all user inputs

## 📋 Dependencies

- **OpenZeppelin Contracts**: Access control and security utilities
- **RedStone EVM Connector**: Oracle integration for price feeds
- **Forge Standard Library**: Testing framework

## 🌐 Multi-chain Deployment

The contract can be deployed on any EVM-compatible chain that RedStone supports:

- **Ethereum Mainnet**
- **Base**
- **Arbitrum**
- **Optimism** 
- **Polygon**
- **Avalanche**
- **Binance Smart Chain**

## 📚 Additional Resources

- [RedStone Oracle Documentation](https://docs.redstone.finance/)
- [RedStone EVM Examples](https://github.com/redstone-finance/redstone-evm-examples)
- [RedStone Data Sources](https://app.redstone.finance/app/sources/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## 🎯 Integration with Hermes Player

This smart contract complements the Hermes Player frontend by:

1. **Dynamic Pricing**: Artworks generated from blockchain data have market-based pricing
2. **Multi-chain Support**: Works with the same chains supported by the audio/visual generator
3. **Real-time Updates**: Prices reflect current market conditions
4. **Transparency**: All pricing calculations are on-chain and verifiable

The contract can be integrated into the Hermes Player frontend to display current artwork prices in native tokens and enable on-chain purchasing functionality.
