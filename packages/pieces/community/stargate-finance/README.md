# Stargate Finance — Activepieces Piece

> The leading cross-chain bridge protocol built on LayerZero, enabling native asset transfers between blockchains.

## Overview

This piece integrates **Stargate Finance** data into your Activepieces workflows using free, public APIs from DeFiLlama and CoinGecko. No API key required.

## Actions

| Action | Description | API |
|--------|-------------|-----|
| **Get Protocol TVL** | Total value locked across all chains | DeFiLlama |
| **Get STG Price** | Current STG token price, market cap, 24h volume | CoinGecko |
| **Get Bridge Pools** | All active Stargate liquidity pools with APY data | DeFiLlama Yields |
| **Get Protocol Volume** | Bridge volume and transfer statistics | DeFiLlama Bridges |
| **Get Chain TVL** | Per-chain TVL breakdown | DeFiLlama |

## Usage

No authentication is needed. Simply add the Stargate Finance piece to your Activepieces flow and select the desired action.

### Example: Monitor TVL Drop

1. Use a **Schedule** trigger (e.g., every hour)
2. Add **Get Protocol TVL** action
3. Add a **Filter** step to check if TVL dropped > 10%
4. Send an alert via **Slack** or **Telegram**

### Example: STG Price Alert

1. Use a **Schedule** trigger
2. Add **Get STG Price** action
3. Route to notification based on price threshold

## Data Sources

- **DeFiLlama** — `https://api.llama.fi` — Free, no key needed
- **DeFiLlama Yields** — `https://yields.llama.fi` — Free, no key needed
- **CoinGecko** — `https://api.coingecko.com` — Free tier, no key needed

## About Stargate Finance

Stargate is the first fully composable native asset bridge built on [LayerZero](https://layerzero.network/). It enables:

- **Native asset transfers** — no wrapped tokens
- **Instant guaranteed finality**
- **Unified liquidity pools** across 10+ chains
- Deep integration with major DeFi protocols

## Part of the Algora MCP Challenge

This piece was submitted as part of the [Algora MCP Challenge](https://algora.io) to expand the Activepieces piece ecosystem.

## Author

[@bossco7598](https://github.com/bossco7598)
