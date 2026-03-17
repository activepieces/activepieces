# Bifrost Piece for Activepieces

This piece integrates [Bifrost](https://bifrost.finance) — a Polkadot parachain providing multi-chain liquid staking for DOT, KSM, ETH, BNB, GLMR, FIL and more — into Activepieces automation workflows.

## What is Bifrost?

Bifrost is a staking yield layer that establishes a standardized multi-chain liquid staking rewards infrastructure, delivering composable crypto-native yields for stablecoins, RWAs, and DeFi across various blockchains.

- **Native token:** BNC
- **Voucher tokens:** vDOT, vETH, vBNB, vKSM, vGLMR, vFIL
- **Supported chains:** Bifrost parachain, Ethereum, Manta, Astar

## Actions

| Action | Description |
|--------|-------------|
| `get-protocol-tvl` | Fetch current Total Value Locked from DeFiLlama |
| `get-bnc-price` | Fetch BNC price, market cap, and 24h change from CoinGecko |
| `get-chain-breakdown` | TVL broken down by chain, sorted descending with % of total |
| `get-tvl-history` | Historical TVL data with configurable lookback period and % change |
| `get-protocol-stats` | Combined snapshot: TVL + BNC price in a single parallel call |

## Data Sources

- **TVL data:** [DeFiLlama API](https://defillama.com/protocol/bifrost-liquid-staking)
- **Price data:** [CoinGecko API](https://www.coingecko.com/en/coins/bifrost-native-coin)

## Authentication

No API key required. All data is fetched from public endpoints.

## Example Use Cases

- Monitor Bifrost TVL changes and trigger alerts
- Track BNC price movements for portfolio reporting
- Build DeFi dashboards with real-time Bifrost data
- Analyze chain-level liquidity distribution
