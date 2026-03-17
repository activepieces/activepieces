# Parallel Finance

[Parallel Finance](https://parallel.fi) is a DeFi super app built on Polkadot that combines borrowing, lending, liquid staking, and an AMM (automated market maker) into one unified platform. The PARA token is used for governance.

## Actions

| Action | Description | API |
|--------|-------------|-----|
| **Get Protocol TVL** | Current Total Value Locked for Parallel Finance | DeFiLlama |
| **Get PARA Token Price** | PARA price, market cap, 24h change, and volume | CoinGecko |
| **Get Chain TVL Breakdown** | TVL distribution across all deployed chains, sorted by size | DeFiLlama |
| **Get TVL History** | Historical TVL data with configurable day range (default: 30 days) | DeFiLlama |
| **Get Protocol Stats** | Combined TVL + PARA price fetched in parallel in one action | DeFiLlama + CoinGecko |

## Authentication

No authentication required. All APIs are free and public.

## Data Sources

- **DeFiLlama** — `https://api.llama.fi/protocol/parallel` (no API key)
- **CoinGecko** — `https://api.coingecko.com/api/v3/coins/parallel-finance` (no API key)

## Use Cases

- Monitor Polkadot DeFi TVL and alert on significant drops
- Track PARA token price with automated Slack/Discord summaries
- Log historical TVL to Google Sheets for trend analysis
- Build dashboards for Parallel Finance liquidity metrics
