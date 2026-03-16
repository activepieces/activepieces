# Morpho Piece for Activepieces

This piece integrates [Morpho](https://morpho.org) — a decentralized lending protocol that optimizes rates on top of Aave and Compound, offering better yields for both suppliers and borrowers. Morpho Blue is its standalone lending primitive.

## Actions

| Action | Description |
|--------|-------------|
| **Get Protocol TVL** | Fetch Morpho's total value locked (TVL) across all markets from DeFiLlama |
| **Get Morpho Price** | Get MORPHO token price, market cap, and 24h volume from CoinGecko |
| **Get Chain Breakdown** | Get TVL breakdown by chain (Ethereum, Base, etc.) from DeFiLlama |
| **Get Lending Stats** | Get total borrowed vs supplied stats from DeFiLlama |
| **Get TVL History** | Get historical TVL data from DeFiLlama |

## Data Sources

All data is fetched from free, public APIs — no authentication required:

- **DeFiLlama API** — `https://api.llama.fi/protocol/morpho`
- **CoinGecko API** — `https://api.coingecko.com/api/v3/coins/morpho`

## Authentication

No authentication is required. All API endpoints are publicly accessible.

## Example Use Cases

- Monitor Morpho TVL in automated dashboards
- Track MORPHO token price and market metrics
- Analyze lending vs borrowing activity across chains
- Build DeFi portfolio tracking workflows
- Create alerts for significant TVL changes

## Links

- [Morpho Website](https://morpho.org)
- [Morpho Docs](https://docs.morpho.org)
- [DeFiLlama Morpho Page](https://defillama.com/protocol/morpho)
