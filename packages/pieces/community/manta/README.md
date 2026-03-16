# Manta Network Piece for Activepieces

This piece integrates with **Manta Network** — a modular blockchain ecosystem featuring:
- **Manta Pacific**: EVM-compatible L2 with ZK privacy
- **Manta Atlantic**: Polkadot parachain for ZK applications

## Actions

| Action | Description | API |
|--------|-------------|-----|
| `get-protocol-tvl` | Fetch current TVL for Manta protocol | DeFiLlama |
| `get-manta-price` | Get MANTA token price & market data | CoinGecko |
| `get-chain-breakdown` | TVL breakdown by chain (Pacific/Atlantic) | DeFiLlama |
| `get-tvl-history` | Last 30 days historical TVL | DeFiLlama |
| `get-protocol-stats` | Key stats: TVL, chains, category | DeFiLlama |

## APIs Used

All APIs are **free and require no authentication**:
- [DeFiLlama API](https://defillama.com/docs/api)
- [CoinGecko Public API](https://www.coingecko.com/en/api)

## No Auth Required

This piece requires no API keys or authentication configuration.
