# Spark Protocol Piece for Activepieces

Spark Protocol is MakerDAO's decentralized lending market (SparkLend), allowing users to borrow DAI/USDS at subsidized rates using ETH, stETH, and cbBTC as collateral. With ~$3B TVL, it is one of the largest DeFi lending protocols.

## Actions

### Get Protocol TVL
Fetches the current total value locked (TVL) for Spark Protocol from DeFiLlama, along with the list of supported chains.

### Get SPK Price
Retrieves the current SPK token price, market cap, and 24-hour price change from CoinGecko.

### Get Chain Breakdown
Returns a per-chain TVL breakdown for Spark Protocol, sorted by size (largest first), from DeFiLlama.

### Get TVL History
Fetches historical TVL data for Spark Protocol. You can configure the number of days to retrieve (default: 30).

### Get Protocol Stats
A combined action that fetches both TVL data and SPK token price in parallel, returning a unified snapshot of Spark Protocol's current state.

## Data Sources

- **DeFiLlama**: `https://api.llama.fi/protocol/spark` — TVL, chains, historical data
- **CoinGecko**: `https://api.coingecko.com/api/v3/simple/price` — SPK price, market cap, 24h change

## Authentication

No authentication required. All data sources are publicly accessible.

## Links

- [Spark Protocol](https://spark.fi)
- [MakerDAO](https://makerdao.com)
- [DeFiLlama - Spark](https://defillama.com/protocol/spark)
