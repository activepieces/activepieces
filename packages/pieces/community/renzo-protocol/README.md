# Renzo Protocol Piece

An [Activepieces](https://www.activepieces.com) community piece for [Renzo Protocol](https://renzoprotocol.com) — a liquid restaking protocol on Ethereum that issues ezETH via EigenLayer.

## Actions

| Action | Description |
|--------|-------------|
| **Get Protocol TVL** | Fetch Renzo Protocol total value locked from DeFiLlama |
| **Get REZ Price** | Fetch REZ token price, market cap, and 24h change from CoinGecko |
| **Get Chain Breakdown** | Fetch per-chain TVL sorted by size from DeFiLlama |
| **Get TVL History** | Fetch historical TVL data (configurable days, default 30) |
| **Get Protocol Stats** | Combined TVL + price data in a single call |

## Authentication

No authentication required — all data sources are public APIs.

## Data Sources

- **DeFiLlama**: `https://api.llama.fi/protocol/renzo`
- **CoinGecko**: `https://api.coingecko.com/api/v3/simple/price`

## About Renzo

Renzo Protocol is one of the largest Liquid Restaking Token (LRT) protocols, with ~$1.8B TVL. It wraps staked ETH into **ezETH**, enabling users to earn EigenLayer restaking rewards while maintaining liquidity.

- Token: **REZ**
- Restaking Token: **ezETH**
- Website: [renzoprotocol.com](https://renzoprotocol.com)
