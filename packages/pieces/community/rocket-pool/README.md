# Rocket Pool

Rocket Pool is the original decentralized Ethereum liquid staking protocol (since 2016). It allows anyone to stake ETH and receive **rETH** — a yield-bearing liquid staking token — while node operators run validators backed by **RPL** as collateral.

## Actions

| Action | Description |
|--------|-------------|
| **Get Protocol TVL** | Fetch Rocket Pool's current Total Value Locked from DeFiLlama |
| **Get rETH Price** | Get rETH price, market cap, and 24h change from CoinGecko |
| **Get Chain Breakdown** | TVL broken down by chain, sorted descending with % share |
| **Get TVL History** | Historical TVL over configurable days with % change from baseline |
| **Get Protocol Stats** | Combined TVL + rETH price in a single parallel call |

## Authentication

No API key required. All data is fetched from public endpoints:
- [DeFiLlama](https://defillama.com/protocol/rocket-pool) — protocol TVL data
- [CoinGecko](https://www.coingecko.com/en/coins/rocket-pool-eth) — token market data

## Use Cases

- 🔔 Alert when Rocket Pool TVL drops significantly
- 📊 Build real-time ETH staking dashboards
- 📈 Track rETH price and APY over time
- ⚡ Automate staking analytics reports
- 💹 Monitor rETH/ETH peg and market cap
