# StarkNet Piece for Activepieces

StarkNet is a ZK rollup Layer-2 scaling solution on Ethereum, built by StarkWare using STARK proofs. STRK is the native governance and gas token.

## Actions

| Action | Description | API |
|--------|-------------|-----|
| **Get Protocol TVL** | Fetch current Total Value Locked for StarkNet | DeFiLlama |
| **Get STRK Price** | Fetch current STRK token price and market data | CoinGecko |
| **Get Chain TVL Breakdown** | Fetch TVL breakdown by blockchain | DeFiLlama |
| **Get TVL History** | Fetch last 30 days of historical TVL data | DeFiLlama |
| **Get Protocol Stats** | Fetch key stats: TVL, chains, category, audit info | DeFiLlama |

## APIs Used

- **DeFiLlama** - `https://api.llama.fi/protocol/starknet` (free, no auth required)
- **CoinGecko** - `https://api.coingecko.com/api/v3/coins/starknet` (free, no auth required)

## No API Key Required

All actions use free public APIs with no authentication needed.
