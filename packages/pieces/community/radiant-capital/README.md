# Radiant Capital Piece for Activepieces

Connect your Activepieces workflows to [Radiant Capital](https://radiant.capital), a cross-chain money market protocol built on LayerZero.

## Features

This piece provides **5 actions** using free public APIs (no authentication required):

| Action | Description | API Source |
|--------|-------------|------------|
| **Get Protocol TVL** | Total value locked across all chains | DeFiLlama |
| **Get RDNT Price** | RDNT token price, market cap, 24h volume | CoinGecko |
| **Get Chain Breakdown** | TVL breakdown by individual chain | DeFiLlama |
| **Get Lending Stats** | Total borrowed and supplied across protocol | DeFiLlama |
| **Get TVL History** | Historical TVL data over time | DeFiLlama |

## About Radiant Capital

Radiant Capital is a cross-chain lending and borrowing protocol that leverages LayerZero's omnichain infrastructure. Users can deposit assets on one chain and borrow on another, enabling seamless cross-chain DeFi operations.

- **Protocol:** Radiant V2
- **Token:** RDNT
- **Infrastructure:** LayerZero omnichain messaging
- **Chains:** Arbitrum, BNB Chain, Ethereum, and more

## APIs Used

- **DeFiLlama:** `https://api.llama.fi/protocol/radiant-v2` — Protocol TVL data
- **CoinGecko:** `https://api.coingecko.com/api/v3/coins/radiant-capital` — Token market data

No API keys required for either service.

## Authentication

None required — all endpoints are public.
