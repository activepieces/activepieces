# Aave Piece for Activepieces

Connect to [Aave V3](https://aave.com), the leading decentralized lending protocol, to read market data, user positions, protocol stats, and interest rate history.

## Authentication

This piece uses The Graph API to query Aave V3 subgraph data. A Graph API key is optional — the public endpoint works without one — but providing a key increases rate limits.

To get a Graph API key:
1. Visit [The Graph Studio](https://thegraph.com/studio/)
2. Create an account and navigate to **API Keys**
3. Create a new API key and copy it

Leave the field blank to use the free public endpoint.

## Actions

| Action | Description |
|--------|-------------|
| **Get Reserves** | Fetch all Aave V3 reserve/market data including supply APY, borrow APY, and total liquidity |
| **Get User Positions** | Fetch a wallet address's Aave deposits and borrows |
| **Get Protocol Stats** | Fetch aggregate protocol statistics: total TVL, total borrowed, reserve count |
| **Get Market Rates** | Fetch current supply and borrow APY for a specific asset |
| **Get Rate History** | Fetch historical interest rate data for a reserve over time |

## Data Source

Data is sourced from:
- **The Graph** — Aave V3 Ethereum Mainnet subgraph (`Cd2gEDVeqnjBn1hSeqFMitw8Q1iiyV9FYUZkLNRcL87g`)
- **Aave API v2** — For historical rate data (`aave-api-v2.aave.com`)
