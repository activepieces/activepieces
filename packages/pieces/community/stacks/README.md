# Stacks Piece for Activepieces

Integrate [Stacks](https://stacks.co) — the Bitcoin Layer-2 blockchain — into your Activepieces workflows.

## What is Stacks?

Stacks is a Bitcoin Layer-2 blockchain that enables smart contracts and decentralized applications (dApps) while being secured by Bitcoin's proof-of-work. STX is the native token used for transactions and smart contract execution.

## Actions

| Action | Description | API Source |
|--------|-------------|-----------|
| **Get Protocol TVL** | Fetch current Total Value Locked for Stacks | DeFiLlama |
| **Get STX Price** | Get current STX price and market data | CoinGecko |
| **Get Chain TVL Breakdown** | View TVL distribution across chains | DeFiLlama |
| **Get TVL History** | Last 30 days of historical TVL data | DeFiLlama |
| **Get Protocol Stats** | Key stats: TVL, chains, category, 7d change | DeFiLlama |

## APIs Used

- **DeFiLlama**: `https://api.llama.fi/protocol/stacks` — Free, no authentication required
- **CoinGecko**: `https://api.coingecko.com/api/v3/coins/blockstack` — Free, no authentication required

## Authentication

No API key required. All endpoints are publicly accessible.

## Category

BUSINESS_INTELLIGENCE
