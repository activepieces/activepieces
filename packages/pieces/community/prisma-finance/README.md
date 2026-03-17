# Prisma Finance Piece

Activepieces community piece for [Prisma Finance](https://prismafinance.com/) — an Ethereum liquid staking collateral stablecoin protocol.

## Overview

Prisma Finance enables users to mint the **mkUSD** stablecoin using liquid staking tokens (LSTs) as collateral. The **PRISMA** token is used for governance.

## Actions

### Get Protocol TVL
Fetches the current Total Value Locked (TVL) for Prisma Finance from DeFiLlama, including 1-hour, 1-day, and 7-day changes.

### Get PRISMA Price
Retrieves the current PRISMA token price, market capitalization, and 24-hour price change from CoinGecko.

### Get Chain Breakdown
Returns TVL broken down by blockchain, sorted in descending order, with each chain's percentage of total TVL.

### Get TVL History
Fetches historical TVL data for a configurable number of days (default: 30), including percentage change from the baseline.

### Get Protocol Stats
Retrieves a combined snapshot of protocol TVL and PRISMA token price in a single request using parallel API calls.

## Data Sources

- **TVL Data:** [DeFiLlama API](https://defillama.com/docs/api)
- **Price Data:** [CoinGecko API](https://www.coingecko.com/en/api)

## Authentication

No authentication required — both DeFiLlama and CoinGecko public APIs are used.
