# x402 Payment Piece

x402 enables AI workflows to call paid external APIs using HTTP 402 payment protocol.

## Features

- **Call Paid APIs**: Automatically handle HTTP 402 Payment Required responses
- **Solana Integration**: Uses Solana web3.js for signing and sending USDC payments
- **Multi-network Support**: Works with Mainnet Beta, Devnet, and Testnet
- **Flexible Authentication**: Supports custom Solana wallet private key authentication

## Authentication

This piece requires a Solana wallet private key and network selection:
- **Private Key**: Base58 encoded private key for your Solana wallet
- **Network**: Choose between Mainnet Beta, Devnet, or Testnet

## Actions

### Call Paid API with x402

Calls an API endpoint that requires x402 payment. When the API returns a 402 Payment Required response, this action will:
1. Parse the payment requirements from the response
2. Validate the payment amount against your maximum price
3. Sign and send a USDC payment transaction on Solana
4. Retry the original request with the X-Payment header
5. Return the API response

## Supported Currencies

Currently supports USDC on Solana:
- **Mainnet**: USDC mint address `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- **Devnet/Testnet**: Test USDC variants

## Error Handling

- **Price Exceeded**: Throws an error if the required payment exceeds your maximum price
- **Insufficient Funds**: Throws an error if your wallet doesn't have enough USDC
- **Network Errors**: Provides detailed error messages for transaction failures

## License

MIT
