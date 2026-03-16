# Silo Finance Piece for Activepieces

Integrate [Silo Finance](https://silofinance.com) isolated lending markets data into your Activepieces workflows.

Silo Finance is a decentralized lending protocol where each asset pair is isolated in its own "silo", preventing contagion between markets.

## Actions

| Action | Description |
|--------|-------------|
| **Get Protocol TVL** | Get Silo Finance total value locked across all isolated markets |
| **Get SILO Price** | Get SILO token price, market cap, and 24h volume from CoinGecko |
| **Get Chain Breakdown** | Get TVL breakdown by chain (Ethereum, Arbitrum, etc.) |
| **Get Lending Stats** | Get total borrowed vs supplied statistics |
| **Get TVL History** | Get historical TVL data over time |

## Data Sources

- **DeFiLlama** — Protocol TVL, chain breakdown, lending stats, historical data (free, no auth)
- **CoinGecko** — SILO token price and market data (free, no auth)

## Authentication

No authentication required. All data is sourced from free public APIs.

## Links

- [Silo Finance App](https://app.silofinance.com)
- [Silo Finance Docs](https://docs.silofinance.com)
- [DeFiLlama](https://defillama.com/protocol/silo-finance)
