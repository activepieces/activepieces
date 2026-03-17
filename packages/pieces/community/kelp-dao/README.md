# Kelp DAO — Activepieces Community Piece

Integrate **Kelp DAO** liquid restaking protocol data into your Activepieces workflows.

[Kelp DAO](https://kelpdao.xyz) is a liquid restaking protocol built on EigenLayer that lets users restake ETH and LSTs to earn additional rewards while maintaining liquidity via the **rsETH** token.

---

## Actions

### 1. Get Protocol TVL
Fetches the current Total Value Locked for Kelp DAO from DeFiLlama.

**Output:**
- `name` — Protocol name
- `tvl` — Current TVL in USD
- `chains` — List of chains where Kelp DAO operates

### 2. Get rsETH Price
Fetches the current price and market data for rsETH (Kelp DAO's liquid restaking token) from CoinGecko.

**Output:**
- `price_usd` — Current price in USD
- `market_cap_usd` — Market capitalization in USD
- `change_24h_percent` — 24-hour price change percentage

### 3. Get Chain Breakdown
Fetches the TVL breakdown by chain from DeFiLlama, sorted by TVL descending with percentage of total.

**Output:**
- Array of `{ chain, tvl, percentage }` objects sorted by TVL (highest first)

### 4. Get TVL History
Fetches historical TVL data for Kelp DAO from DeFiLlama.

**Properties:**
- `days` (number, default: 30) — Number of recent days to return

**Output:**
- `history` — Array of `{ date, tvl }` objects
- `change_percent` — Percentage change over the selected period
- `period_days` — Number of days returned

### 5. Get Protocol Stats
Fetches a combined snapshot of both protocol TVL and rsETH price in a single action (parallel requests).

**Output:**
- `protocol` — TVL data (same as Get Protocol TVL)
- `token` — Price data (same as Get rsETH Price)
- `fetched_at` — ISO timestamp of when data was fetched

---

## Authentication

No authentication required. All data is fetched from public APIs:
- [DeFiLlama API](https://defillama.com/docs/api)
- [CoinGecko API](https://www.coingecko.com/en/api/documentation)

---

## Category

`BUSINESS_INTELLIGENCE`
