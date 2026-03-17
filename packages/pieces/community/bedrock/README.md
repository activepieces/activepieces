# Bedrock

Bedrock is a non-custodial multi-chain liquid staking protocol built in partnership with RockX. It supports ETH liquid staking (uniETH), BTC liquid staking (uniBTC), and IoTeX liquid staking (uniIOTX), with BR as its governance token.

## Actions

- **Get Protocol TVL** — Fetch current total value locked (TVL) from DeFiLlama with 1h/1d/7d percentage changes.
- **Get BR Price** — Fetch BR token price, market cap, and 24h change from CoinGecko.
- **Get Chain Breakdown** — Get TVL distributed across all supported chains, sorted by TVL descending with percentage of total.
- **Get TVL History** — Historical TVL data with configurable number of days and percentage change from baseline.
- **Get Protocol Stats** — Combines TVL and BR price data in a single call using parallel requests.

## Authentication

No authentication required. All data is sourced from public DeFiLlama and CoinGecko APIs.
