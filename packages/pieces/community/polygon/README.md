# Polygon Piece for Activepieces

This piece integrates **Polygon** (MATIC/POL) blockchain data into Activepieces workflows.

Polygon is a leading Ethereum scaling solution offering a PoS sidechain and multiple Layer-2 solutions. POL (formerly MATIC) is the native token.

## Actions

| Action | API | Description |
|--------|-----|-------------|
| **Get Protocol TVL** | DeFiLlama | Current Total Value Locked for Polygon |
| **Get POL Price** | CoinGecko | Real-time POL price, market cap, 24h volume |
| **Get Chain TVL Breakdown** | DeFiLlama | TVL split by individual chain |
| **Get TVL History** | DeFiLlama | Last 30 days of historical TVL data |
| **Get Protocol Stats** | DeFiLlama | Key stats: TVL, chains, category, 7d/30d change |

## Authentication

No API key required. All actions use free public APIs.

## APIs Used

- [DeFiLlama API](https://defillama.com/docs/api) - Free, no auth
- [CoinGecko API](https://www.coingecko.com/en/api) - Free tier, no auth required
