# GMX Piece for Activepieces

Connect your Activepieces workflows to [GMX](https://gmx.io) — one of the largest decentralized perpetuals and spot trading platforms, operating on Arbitrum and Avalanche.

## Actions

| Action | Description |
|--------|-------------|
| **Get Protocol Stats** | Retrieve GMX protocol metrics including fees, volume, and users |
| **Get Pool Info** | Get GLP/GM pool composition, size, and APR data |
| **Get Token Prices** | Get GMX token price with market cap and 24h volume |
| **Get Protocol TVL** | Get GMX total value locked across all chains via DeFiLlama |
| **Get Volume Stats** | Get historical trading volume data |

## Authentication

No authentication required. All actions use free public APIs:

- [GMX Stats API](https://stats.gmx.io) — Protocol metrics, pool data, volume
- [DeFiLlama](https://defillama.com) — TVL data across chains
- [CoinGecko](https://coingecko.com) — Token price data

## Supported Chains

- **Arbitrum** (default)
- **Avalanche**

## About GMX

GMX is a decentralized spot and perpetual exchange that supports low swap fees and zero price impact trades. Trading is supported by a unique multi-asset pool that earns liquidity providers fees from market making, swap fees and leverage trading.

- Website: [https://gmx.io](https://gmx.io)
- Documentation: [https://docs.gmx.io](https://docs.gmx.io)
- Twitter: [@GMX_IO](https://twitter.com/GMX_IO)
