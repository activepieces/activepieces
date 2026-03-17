# Puffer Finance Piece for Activepieces

A community piece that integrates [Puffer Finance](https://puffer.fi) — a native liquid restaking protocol on Ethereum — with Activepieces automation workflows.

## Overview

Puffer Finance allows ETH stakers to earn both Ethereum staking rewards and EigenLayer restaking rewards via the **pufETH** liquid restaking token. With ~$1.5B TVL, it's one of the leading liquid restaking protocols.

## Actions

### 1. Get Protocol TVL
Fetch the current Total Value Locked (TVL) for Puffer Finance from DeFiLlama.
- **Output:** Protocol name, current TVL in USD, supported chains

### 2. Get Puffer Price
Fetch the current PUFFER token price and market data from CoinGecko.
- **Output:** Price in USD, market cap, 24h price change percentage

### 3. Get Chain Breakdown
Get per-chain TVL distribution sorted by size from DeFiLlama.
- **Output:** Array of `{ chain, tvl }` objects, sorted descending by TVL

### 4. Get TVL History
Retrieve historical TVL data for a configurable number of days.
- **Input:** Number of days (default: 30)
- **Output:** Array of `{ date, tvl }` objects

### 5. Get Protocol Stats
Fetch TVL and price data in a single parallel call for efficiency.
- **Output:** Combined object with TVL data and token price metrics

## Data Sources

| Source | Endpoint |
|--------|----------|
| DeFiLlama | `https://api.llama.fi/protocol/puffer-finance` |
| CoinGecko | `https://api.coingecko.com/api/v3/simple/price` |

No API keys required — all endpoints are public.

## Authentication

None required. All data sources are free and public.

## Usage

1. Add the **Puffer Finance** piece to your Activepieces flow
2. Choose an action
3. Connect outputs to downstream steps (Slack, Google Sheets, Discord, etc.)

## Use Cases

- Monitor pufETH TVL changes and alert on large movements
- Track PUFFER token price and send daily summaries
- Build DeFi dashboards with live restaking protocol data
- Alert when TVL drops below a threshold
- Log historical TVL data to a spreadsheet

## Author

Built by [Bossco](https://github.com/bossco7598) for the Activepieces MCP Challenge.
