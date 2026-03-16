# Osmosis Piece for Activepieces

Integrate **Osmosis** — the leading DEX and DeFi hub on the Cosmos ecosystem — into your Activepieces automations.

## About Osmosis

Osmosis is the premier decentralized exchange built on the Cosmos SDK, featuring:
- 🌊 **Concentrated Liquidity** — Capital-efficient liquidity positions
- 🔗 **IBC Cross-Chain Swaps** — Seamless inter-blockchain communication swaps
- 🔒 **Superfluid Staking** — Stake while providing liquidity for double yield
- 🏗️ **DeFi Hub** — Central hub for the Cosmos ecosystem's DeFi activity

## Actions

| Action | Description |
|--------|-------------|
| `get_protocol_tvl` | Get Osmosis Total Value Locked (TVL) from DeFiLlama |
| `get_osmo_price` | Get OSMO token price, market cap, and 24h volume from CoinGecko |
| `get_pools` | Get all Osmosis liquidity pools from DeFiLlama Yields |
| `get_pool_apys` | Get pool APYs with optional minimum APY filter |
| `get_chain_stats` | Get Osmosis chain TVL stats from DeFiLlama chains endpoint |

## Authentication

No authentication required — all data is fetched from public APIs (DeFiLlama and CoinGecko).

## Data Sources

- **DeFiLlama** — `https://api.llama.fi` (TVL, chain stats)
- **DeFiLlama Yields** — `https://yields.llama.fi` (pool data, APYs)
- **CoinGecko** — `https://api.coingecko.com/api/v3` (token price and market data)

## Links

- [Osmosis](https://osmosis.zone)
- [Activepieces](https://www.activepieces.com)
- [DeFiLlama](https://defillama.com/protocol/osmosis)
