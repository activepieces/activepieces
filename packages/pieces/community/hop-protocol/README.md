# Hop Protocol Piece for Activepieces

Get real-time DeFi data from [Hop Protocol](https://hop.exchange/), the fast L2 cross-chain bridge enabling token transfers between Ethereum mainnet and Layer 2 networks.

## Supported Networks

- Ethereum Mainnet
- Arbitrum
- Optimism
- Polygon
- Base
- Gnosis

## Actions

| Action | Description | API Source |
|--------|-------------|------------|
| **Get Protocol TVL** | Total value locked across all chains | DeFiLlama |
| **Get HOP Price** | Current HOP token price, market cap, and 24h volume | CoinGecko |
| **Get Bridge Stats** | Bridge pool stats and APY data | DeFiLlama Yields |
| **Get Transfer Volume** | Historical bridge transfer volume | DeFiLlama Bridges |
| **Get Chain TVL** | Total TVL number for Hop Protocol | DeFiLlama |

## Authentication

No API key required — all data is sourced from free public APIs (DeFiLlama & CoinGecko).

## Usage

1. Add the **Hop Protocol** piece to your Activepieces flow
2. Select any of the 5 available actions
3. Connect the output to downstream steps

## Links

- [Hop Protocol](https://hop.exchange/)
- [DeFiLlama](https://defillama.com/protocol/hop-protocol)
- [CoinGecko HOP](https://www.coingecko.com/en/coins/hop-protocol)
