# Stader Labs

[Stader Labs](https://www.staderlabs.com/) is a multichain liquid staking protocol that enables users to stake assets across multiple blockchains and receive liquid staking tokens in return.

## Supported Networks

- **Ethereum** → ETHx (liquid staking token)
- **Polygon** → MaticX
- **BNB Chain** → BNBx
- **Hedera** → HBARX
- **Near** → NearX

## Actions

| Action | Description | API |
|--------|-------------|-----|
| Get Protocol TVL | Fetch total value locked across all Stader deployments | DeFiLlama |
| Get SD Token Price | Get the current USD price of SD (Stader governance token) | CoinGecko |
| Get ETHx Price | Get the current USD price of ETHx (Ethereum liquid staking token) | CoinGecko |
| Get Chain Breakdown | Get TVL breakdown by blockchain | DeFiLlama |
| Get TVL History | Get last 30 days of historical TVL data | DeFiLlama |

## Authentication

No API key required. All data is fetched from public free APIs:
- [DeFiLlama API](https://defillama.com/docs/api)
- [CoinGecko API](https://www.coingecko.com/en/api)
