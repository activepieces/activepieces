# StakeWise Piece for Activepieces

Fetch live protocol data for **StakeWise** — an Ethereum liquid staking protocol with a vault-based architecture.

## What is StakeWise?

[StakeWise](https://stakewise.io/) allows users to stake ETH via permissionless vaults and receive **osETH** (overcollateralized staked ETH) as a liquid staking token. The **SWISE** token governs the protocol.

## Actions

| Action | Description |
|---|---|
| **Get Protocol TVL** | Fetch total value locked from DeFiLlama |
| **Get SWISE Price** | Fetch SWISE token price, market cap, and 24h change from CoinGecko |
| **Get Chain Breakdown** | TVL broken down by chain, sorted descending with % of total |
| **Get TVL History** | Historical TVL over configurable number of days with % change |
| **Get Protocol Stats** | Combined TVL + SWISE price in a single action |

## Authentication

No API key required. All data is fetched from public endpoints:
- [DeFiLlama API](https://defillama.com/docs/api)
- [CoinGecko API](https://www.coingecko.com/en/api)

## Author

Built by **Bossco** for the MCP Challenge.
