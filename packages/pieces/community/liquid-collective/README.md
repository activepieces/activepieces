# Liquid Collective — Activepieces Piece

Fetch real-time and historical data from the **Liquid Collective** enterprise liquid staking protocol.

## About Liquid Collective

[Liquid Collective](https://liquidcollective.io/) is an enterprise-grade liquid staking protocol for ETH, backed by major institutional players including Coinbase, Figment, and Alluvial. Their liquid staking token is **LsETH** (Liquid Staked ETH).

- No governance token — pure institutional focus
- Multi-chain liquid staking
- Enterprise-grade security and compliance

## Actions

### Get Protocol TVL
Fetches total value locked (TVL) for Liquid Collective from DeFiLlama.

**Output:**
- Protocol name
- Current TVL (USD)
- Chain list

### Get LsETH Price
Fetches the current LsETH token price and market data from CoinGecko.

**Output:**
- Current price (USD)
- Market capitalization
- 24-hour price change (%)

### Get Chain Breakdown
Fetches TVL broken down by chain, sorted by TVL descending, with percentage of total.

**Output:**
- Chain name
- TVL (USD)
- Percentage of total TVL

### Get TVL History
Fetches historical TVL data with a configurable lookback window (default 30 days).

**Output:**
- Date-indexed TVL values
- Percentage change from baseline

### Get Protocol Stats
Combined single-call action that returns TVL and LsETH price in parallel.

**Output:**
- TVL
- LsETH price
- Market cap
- 24h change

## Authentication

No API key required. All data is fetched from public endpoints (DeFiLlama, CoinGecko).

## Category

`BUSINESS_INTELLIGENCE`
