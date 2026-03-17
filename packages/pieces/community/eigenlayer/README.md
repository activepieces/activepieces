# EigenLayer Piece for Activepieces

This piece integrates [EigenLayer](https://eigenlayer.xyz) — the foundational restaking protocol on Ethereum — into Activepieces workflows.

EigenLayer enables ETH restakers to extend cryptoeconomic security to other applications (AVSs — Actively Validated Services), creating a shared security marketplace on Ethereum.

## Actions

### 1. Get Protocol TVL
Fetches the current Total Value Locked (TVL) for EigenLayer from DeFiLlama.

**Returns:** Protocol name, current TVL (USD), and list of chains with their TVL.

### 2. Get EIGEN Token Price
Fetches the current price and market data for the EIGEN token from CoinGecko.

**Returns:** Current price (USD), market cap (USD), and 24-hour price change (%).

### 3. Get Chain Breakdown
Fetches and parses the TVL breakdown by chain for EigenLayer.

**Returns:** Array of chains sorted by TVL descending, each with name, TVL, and percentage of total TVL.

### 4. Get TVL History
Fetches historical TVL data for EigenLayer with configurable time range.

**Props:**
- `days` (default: 30) — Number of days of history to return

**Returns:** Array of historical TVL data points with date, TVL, and percentage change from the first data point.

### 5. Get Protocol Stats
Combines TVL and price data into a single comprehensive response.

**Returns:** Combined object with protocol TVL data and EIGEN token market data.

## Data Sources

- **TVL Data:** [DeFiLlama API](https://defillama.com/docs/api)
- **Price Data:** [CoinGecko API](https://www.coingecko.com/en/api)

## Authentication

No API key required. Both DeFiLlama and CoinGecko public APIs are used without authentication.
