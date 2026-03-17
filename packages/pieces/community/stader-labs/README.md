# Stader Labs Piece for Activepieces

Fetch live on-chain and market data from [Stader Labs](https://www.stader.io/) — a multi-chain liquid staking protocol supporting ETH, BNB, MATIC, NEAR, FANTOM, and more.

## Actions

| Action | Description |
|--------|-------------|
| **Get Protocol TVL** | Fetch total value locked from DeFiLlama |
| **Get SD Price** | Fetch SD token price, market cap, and 24h change from CoinGecko |
| **Get Chain Breakdown** | TVL broken down by chain, sorted by size with % of total |
| **Get TVL History** | Historical TVL data with configurable lookback window |
| **Get Protocol Stats** | Combined protocol stats (TVL + SD price) in one call |

## Authentication

No API key required. All data is fetched from public APIs:
- [DeFiLlama](https://defillama.com/protocol/stader)
- [CoinGecko](https://www.coingecko.com/en/coins/stader)

## About Stader Labs

Stader Labs is a non-custodial smart contract-based staking platform. Their liquid staking token for Ethereum is **ETHx**. The native protocol token is **SD** (Stader).

- Website: https://www.stader.io/
- Docs: https://docs.staderlabs.com/
- Token: SD
