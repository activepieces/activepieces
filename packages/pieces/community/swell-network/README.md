# Swell Network Piece for Activepieces

This piece integrates with **Swell Network** — an Ethereum liquid staking and restaking protocol offering swETH (staked ETH) and rswETH (restaked ETH), with SWELL as the governance token.

## Actions

### 1. Get Protocol TVL
Fetches the current Total Value Locked (TVL) for Swell Network from DeFiLlama.
- **Returns:** Protocol name, current TVL (USD), and list of supported chains

### 2. Get SWELL Price
Fetches the current SWELL token price from CoinGecko.
- **Returns:** USD price, market cap, and 24-hour price change percentage

### 3. Get Chain Breakdown
Fetches TVL breakdown by chain from DeFiLlama, sorted by TVL descending.
- **Returns:** Array of chains with TVL amount and percentage of total TVL

### 4. Get TVL History
Fetches historical TVL data from DeFiLlama with configurable lookback period.
- **Props:** `days` (default: 30) — number of historical days to retrieve
- **Returns:** Array of date/TVL entries plus overall percentage change for the period

### 5. Get Protocol Stats
Combines protocol TVL and SWELL token price into a single unified response.
- **Returns:** All data from Get Protocol TVL and Get SWELL Price in one call

## Data Sources
- **DeFiLlama:** https://api.llama.fi/protocol/swell-network
- **CoinGecko:** https://api.coingecko.com/api/v3/simple/price

## Authentication
No API key required — uses public endpoints only.
