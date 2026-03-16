# Synthetix

This piece provides integration with the Synthetix protocol, allowing you to fetch synthetic asset rates, SNX staking data, exchange statistics, and fee pool information using The Graph subgraphs.

## Authentication

No authentication required. This piece uses public The Graph subgraphs.

## Actions

### Get Synth Rates
Fetch current exchange rates for sUSD, sBTC, sETH, and other synthetic assets.

### Get SNX Stakers
Get top SNX stakers with their collateral ratio and debt information.

### Get Exchange Stats
Retrieve 24h volume, unique traders, and total fees for the Synthetix exchange.

### Get Issued Synths
Get total synths issued by type (sUSD, sBTC, sETH, etc.).

### Get Fee Pool
Fetch current fee pool data including claimable fees and period information.

## API

This piece uses the following The Graph subgraphs:
- Synthetix Mainnet: https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix
- SNX Rates: https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix-rates
