# Cosmos Hub Piece for Activepieces

Integrate **Cosmos Hub** (ATOM staking) data into your Activepieces workflows using free public APIs from DeFiLlama and CoinGecko.

## About Cosmos Hub

The **Cosmos Hub** is the first blockchain in the Cosmos ecosystem, powered by the **ATOM** token. It serves as the economic center of the Cosmos network, enabling IBC (Inter-Blockchain Communication) between hundreds of sovereign chains. ATOM holders can stake their tokens to earn staking rewards and participate in governance.

- 🔗 **IBC Hub** — Central relay chain for the Cosmos interchain ecosystem
- 🪙 **ATOM Staking** — Stake ATOM to earn ~15-20% APR staking rewards
- 🏛️ **Governance** — ATOM holders vote on protocol upgrades and parameters
- 🌐 **275+ Chains** — Connected via IBC to the wider Cosmos ecosystem

## Actions

| Action | Description | API |
|--------|-------------|-----|
| `get_protocol_tvl` | Fetch Total Value Locked for Cosmos Hub | DeFiLlama |
| `get_atom_price` | Get ATOM price, market cap, and 24h volume | CoinGecko |
| `get_chain_breakdown` | TVL breakdown by chain | DeFiLlama |
| `get_tvl_history` | Historical TVL data for last 30 days | DeFiLlama |
| `get_protocol_stats` | Key stats: TVL, chains, category | DeFiLlama |

## Authentication

🔓 **No authentication required** — All data is sourced from public APIs (DeFiLlama & CoinGecko). No API keys needed.

## API Sources

- **DeFiLlama**: `https://api.llama.fi/protocol/cosmos`
- **CoinGecko**: `https://api.coingecko.com/api/v3/coins/cosmos`
