# Kamino Finance Piece for Activepieces

Integrate Kamino Finance — Solana's leading lending and automated liquidity protocol — into your Activepieces workflows.

## Overview

Kamino Finance offers:
- **Concentrated Liquidity Vaults** — automated market-making strategies
- **Kamino Lend** — lending and borrowing on Solana
- **Leverage** — leveraged yield strategies
- **KMNO Token** — governance and utility token

With ~$2B TVL, Kamino is one of the largest DeFi protocols on Solana.

## Actions

### Get Protocol TVL
Fetch the current Total Value Locked (TVL) for Kamino Finance from DeFiLlama, including the protocol name and supported chains.

**Output:**
- `name` — Protocol name
- `tvl` — Current TVL in USD
- `chains` — List of supported chains

### Get KMNO Price
Fetch the current KMNO token price, market cap, and 24-hour price change from CoinGecko.

**Output:**
- `price` — Current price in USD
- `marketCap` — Market capitalization in USD
- `change24h` — 24-hour price change percentage

### Get Chain Breakdown
Fetch per-chain TVL breakdown from DeFiLlama, sorted by TVL (largest first).

**Output:**
- Array of `{ chain, tvl }` objects sorted descending by TVL

### Get TVL History
Fetch historical TVL data for Kamino Finance over a configurable number of days.

**Props:**
- `days` — Number of days of history to return (default: 30)

**Output:**
- `history` — Array of `{ date, tvl }` objects
- `days` — Number of days returned

### Get Protocol Stats
Fetch a combined snapshot of TVL and KMNO price data in a single call (parallel requests).

**Output:**
- `protocol` — Name, TVL, and chains
- `token` — Price, market cap, and 24h change

## Data Sources

- **DeFiLlama**: `https://api.llama.fi/protocol/kamino`
- **CoinGecko**: `https://api.coingecko.com/api/v3/simple/price`

Both APIs are free and require no authentication.

## Authentication

No authentication required — all data is fetched from public APIs.

## Links

- [Kamino Finance](https://kamino.finance)
- [Kamino Docs](https://docs.kamino.finance)
- [KMNO on CoinGecko](https://www.coingecko.com/en/coins/kamino)
- [Kamino on DeFiLlama](https://defillama.com/protocol/kamino)

## Author

Built by [Bossco](https://github.com/bossco7598) for the Activepieces MCP Challenge.
