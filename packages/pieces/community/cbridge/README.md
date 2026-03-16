# @activepieces/piece-cbridge

Activepieces community piece for **Celer Network cBridge** — a cross-chain bridge supporting 40+ chains with fast, low-cost asset transfers. CELR is the governance and staking token of the Celer Network.

## Actions

| Action | Description | API |
|--------|-------------|-----|
| `get_protocol_tvl` | Total value locked across all supported chains | DeFiLlama |
| `get_celr_price` | CELR token price, market cap, 24h volume | CoinGecko |
| `get_chain_breakdown` | TVL breakdown by chain with percentage share | DeFiLlama |
| `get_tvl_history` | Historical TVL data (configurable days, default 30) | DeFiLlama |
| `get_protocol_stats` | Key stats: TVL, chain count, 7d/30d change, metadata | DeFiLlama |

## Authentication

None required — all actions use free public APIs from DeFiLlama and CoinGecko.

## APIs Used

- **DeFiLlama**: `https://api.llama.fi/protocol/cbridge`
- **CoinGecko**: `https://api.coingecko.com/api/v3/simple/price`

## Category

`BUSINESS_INTELLIGENCE`
