# Ankr

Ankr is one of the oldest and largest multi-chain staking and Web3 infrastructure platforms, providing liquid staking across 10+ blockchains. Their liquid staking tokens include ankrETH, ankrBNB, ankrMATIC, and more.

## Actions

### Get Protocol TVL
Fetches Ankr's Total Value Locked (TVL) data from DeFiLlama. Returns the protocol name, current TVL, and the list of chains where Ankr operates.

### Get ANKR Price
Fetches the current ANKR token price from CoinGecko, including market cap and 24-hour price change.

### Get Chain Breakdown
Retrieves Ankr's TVL broken down by individual blockchain, sorted in descending order with each chain's percentage of total TVL.

### Get TVL History
Fetches historical TVL data for Ankr from DeFiLlama, with a configurable number of days (default: 30). Includes percentage change from the baseline (first data point).

### Get Protocol Stats
Combines TVL and ANKR token price data in a single parallel fetch, providing a comprehensive overview of the Ankr protocol.

## Authentication

No API key required. All data is fetched from public APIs (DeFiLlama and CoinGecko).

## Links

- [Ankr Website](https://www.ankr.com/)
- [Ankr Documentation](https://www.ankr.com/docs/)
- [DeFiLlama - Ankr](https://defillama.com/protocol/ankr)
- [CoinGecko - ANKR](https://www.coingecko.com/en/coins/ankr-network)
