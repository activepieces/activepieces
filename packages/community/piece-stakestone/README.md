# StakeStone Piece for Activepieces

[StakeStone](https://stakestone.io) is an omnichain yield-bearing ETH liquid staking protocol. STONE is its native token.

## Actions

| Action | Description |
|--------|-------------|
| `get-protocol-tvl` | Fetch current Total Value Locked (TVL) from DeFiLlama |
| `get-stone-price` | Fetch STONE token price, market cap, and 24h change from CoinGecko |
| `get-chain-breakdown` | TVL breakdown by chain, sorted descending with % of total |
| `get-tvl-history` | Historical TVL data with configurable days window and % change from baseline |
| `get-protocol-stats` | Combined protocol stats — TVL + STONE price in a single parallel call |

## Auth

No authentication required (PieceAuth.None).

## Data Sources

- **TVL:** [DeFiLlama](https://defillama.com/protocol/stakestone)
- **Price:** [CoinGecko](https://www.coingecko.com/en/coins/stakestone-ether)
