# Drift Protocol — Activepieces Piece

> **The leading decentralized perpetuals and spot exchange on Solana with cross-margin trading.**

This piece integrates [Drift Protocol](https://www.drift.trade/) into [Activepieces](https://www.activepieces.com/), enabling no-code automation flows powered by real-time DeFi data from Solana's #1 perps exchange.

---

## Actions

| Action | Description | Endpoint |
|---|---|---|
| **Get Markets** | List all perpetual markets on Drift | `GET /v2/markets` |
| **Get Market Info** | Fetch details for a specific market (BTC, ETH, SOL, etc.) | `GET /v2/market/{marketIndex}` |
| **Get Protocol TVL** | Fetch Drift Protocol TVL from DeFiLlama | DeFiLlama API |
| **Get Drift Stats** | Fetch DRIFT token price, market cap, 24h volume via CoinGecko | CoinGecko API |
| **Get Top Traders** | Leaderboard — top 10 traders by total volume | `GET /v2/leaderboard` |

---

## Auth

No authentication required. All endpoints are free public APIs:
- Drift Protocol public API (`mainnet-beta.api.drift.trade`)
- DeFiLlama (`api.llama.fi`)
- CoinGecko (`api.coingecko.com`)

---

## About Drift Protocol

Drift Protocol is a decentralized exchange (DEX) built on Solana offering:
- **Perpetual futures** with up to 10x leverage
- **Spot trading** across major assets
- **Cross-margin** — one account, all positions
- Fully on-chain, non-custodial

Website: [drift.trade](https://www.drift.trade/)
Docs: [docs.drift.trade](https://docs.drift.trade/)

---

## Part of the Algora MCP Challenge

This piece was built as part of the [Algora MCP Challenge](https://algora.io/) to expand the Activepieces ecosystem with high-quality DeFi integrations.
