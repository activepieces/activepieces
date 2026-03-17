# Ether.fi Piece for Activepieces

Activepieces community piece for **[Ether.fi](https://ether.fi)** — the largest Ethereum liquid restaking protocol.

Ether.fi allows users to stake ETH and receive **weETH** (wrapped staked ETH), while the **ETHFI** governance token gives holders voting rights over the protocol.

## Actions

### 1. Get Protocol TVL
Fetches the current Total Value Locked (TVL) for the Ether.fi protocol via DeFiLlama.

**Returns:** Protocol name, current TVL (USD), and list of supported chains.

### 2. Get ETHFI Token Price
Fetches the current price, market cap, and 24-hour price change for the ETHFI governance token via CoinGecko.

**Returns:** Price (USD), market cap (USD), and 24h price change (%).

### 3. Get Chain Breakdown
Fetches TVL distribution across all chains where Ether.fi operates, sorted by TVL descending.

**Returns:** Array of chains with TVL amounts and percentage of total TVL.

### 4. Get TVL History
Fetches historical TVL data for Ether.fi over a configurable number of days (default: 30).

**Returns:** Array of daily TVL snapshots with dates, TVL values, and percentage change from the start of the period.

### 5. Get Protocol Stats
Combines protocol TVL data and ETHFI token price into a single consolidated response (parallel fetch for efficiency).

**Returns:** Complete protocol overview including TVL, chains, token price, market cap, and 24h change.

## Data Sources

- **DeFiLlama API:** https://api.llama.fi — Protocol TVL and historical data
- **CoinGecko API:** https://api.coingecko.com — Token price data

## Authentication

No API key required. All endpoints are publicly accessible.
