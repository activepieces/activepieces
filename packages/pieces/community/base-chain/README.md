# Base Chain Piece for Activepieces

This piece integrates with **Base** — Coinbase's Ethereum Layer-2 blockchain built on the OP Stack (optimistic rollups). Base is one of the fastest-growing L2s by TVL and transaction volume, using ETH as its native gas token.

## Actions

- **Get Protocol TVL** — Fetch the current Total Value Locked (TVL) for the Base protocol via DeFiLlama.
- **Get ETH Price** — Fetch the current ETH price (used on Base as the gas token) via CoinGecko.
- **Get Chain Breakdown** — Retrieve TVL breakdown by chain for Base via DeFiLlama.
- **Get TVL History** — Fetch the last 30 days of historical TVL data for Base via DeFiLlama.
- **Get Protocol Stats** — Retrieve key protocol statistics (TVL, chains, category) for Base via DeFiLlama.

## APIs Used

- [DeFiLlama API](https://defillama.com/docs/api) — Free, no authentication required.
- [CoinGecko API](https://www.coingecko.com/en/api) — Free tier, no API key required.
