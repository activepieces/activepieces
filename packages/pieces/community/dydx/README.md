# dYdX Piece for Activepieces

Integrate [dYdX](https://dydx.exchange) — the leading decentralized perpetuals trading platform — into your Activepieces workflows.

dYdX v4 operates as a standalone Cosmos-based blockchain with a free public indexer API requiring no authentication.

## Actions

| Action | Description |
|--------|-------------|
| **Get Perpetual Markets** | List all available perpetual trading pairs |
| **Get Market Orderbook** | Get real-time orderbook for any market |
| **Get Market Trades** | Get recent trades for a market |
| **Get Account Positions** | Get open positions for a dYdX address |
| **Get Candles** | Get OHLCV candlestick data |

## API

- **Base URL:** `https://indexer.dydx.trade/v4`
- **Authentication:** None required
- **Docs:** [dYdX Indexer API](https://indexer.dydx.trade/v4)

## Usage Examples

### Get Markets
Fetch all available perpetual markets with their current stats.

### Get Orderbook
Provide a ticker like `BTC-USD` or `ETH-USD` to retrieve the live orderbook.

### Get Candles
Select a ticker and resolution (1MIN to 1WEEK) to get OHLCV data.

### Get Account Positions
Provide a dYdX chain address (e.g. `dydx1abc...`) to view open positions.
