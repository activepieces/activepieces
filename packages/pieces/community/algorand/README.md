# Algorand Piece for Activepieces

Algorand is a high-performance, pure proof-of-stake (PPoS) Layer-1 blockchain designed for speed, security, and decentralization. ALGO is the native token.

## Actions

| Action | API | Description |
|--------|-----|-------------|
| **Get Protocol TVL** | DeFiLlama | Full Algorand protocol data including current TVL and token breakdown |
| **Get ALGO Price** | CoinGecko | Current ALGO price, market cap, 24h volume, and price changes |
| **Get Chain TVL Breakdown** | DeFiLlama | TVL breakdown across individual DeFi protocols on Algorand |
| **Get TVL History (30 Days)** | DeFiLlama | Historical TVL data for the last 30 days |
| **Get Protocol Stats** | DeFiLlama | Key stats: TVL, chains, category, description |

## APIs Used

- **DeFiLlama** — `https://api.llama.fi/protocol/algorand` (free, no API key)
- **CoinGecko** — `https://api.coingecko.com/api/v3/coins/algorand` (free, no API key)

## No Authentication Required

All actions use free public APIs with no API key needed.
