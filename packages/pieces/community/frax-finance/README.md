# Frax Finance Piece for Activepieces

This piece integrates [Frax Finance](https://frax.finance) with Activepieces, enabling automated workflows around the Frax stablecoin protocol and its ecosystem.

## About Frax Finance

Frax Finance is the world's first fractional-algorithmic stablecoin protocol. It pioneered a hybrid approach to stablecoin design, partially backed by collateral and partially stabilized algorithmically. The protocol has expanded into multiple DeFi verticals:

- **FRAX** — Fractional-algorithmic USD stablecoin
- **FXS** — Frax Share governance and value accrual token
- **frxETH** — Liquid staking token for Ethereum
- **FraxSwap** — Native AMM with TWAMM capabilities
- **Fraxlend** — Isolated lending pairs

## Actions

### 1. `get_protocol_tvl`
Fetches the total value locked (TVL) for Frax Finance from DeFiLlama. Returns the current TVL, historical data, and protocol metadata.

### 2. `get_frax_price`
Retrieves the current price of FRAX stablecoin and FXS (Frax Share) governance token from CoinGecko, including market cap and 24-hour volume.

### 3. `get_frxeth_stats`
Gets liquid staking statistics for frxETH from DeFiLlama Yields API. Returns APY, TVL, and pool details for Frax's ETH liquid staking product.

### 4. `get_fraxswap_pools`
Fetches FraxSwap AMM pool data from DeFiLlama Yields API, including APY and liquidity metrics for all active FraxSwap pools.

### 5. `get_chain_tvl`
Returns a breakdown of Frax Finance's TVL across all supported blockchain networks.

## Authentication

No authentication required. All data is sourced from public APIs (DeFiLlama, CoinGecko).

## Usage

Use these actions to build automation workflows such as:
- Monitor FRAX depeg events and send alerts
- Track TVL changes across chains
- Build DeFi dashboards with live Frax data
- Automate reports on frxETH staking performance
