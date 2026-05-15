# x402 Piece for Activepieces

## Task
Add an x402 payment piece to Activepieces (https://github.com/activepieces/activepieces) that enables AI workflows to call paid external APIs using the x402 HTTP 402 payment protocol.

## What to Build
A new Activepieces piece that:
1. Provides an action: "Call Paid API with x402"
2. Takes endpoint URL, request body, max price, network as input
3. Handles HTTP 402 Payment Required responses
4. Signs and sends USDC payment via x402 protocol
5. Retries the request with X-Payment header
6. Returns the paid API response + transaction hash

## Technical Approach
- Activepieces pieces are in packages/server/src/ as TypeScript modules
- Each piece has: index.ts (piece definition), actions/, common/
- Study existing pieces (like http-piece) for patterns
- Use Solana web3.js for SPL TransferChecked signing
- Store wallet key in Activepieces auth/credential system

## Key Files to Study
- packages/server/src/pieces/community/ /* community piece patterns */
- packages/server/src/app/app-encryption.ts /* credential encryption */
- packages/engine/src/engine/http-client.ts /* HTTP utilities */

## x402 Protocol Flow
```
1. Action calls endpoint → 402 + payment requirements
2. Parse: maxAmountRequired, asset (USDC mint), payTo, network, scheme, extra (decimals, computeUnits)
3. Build Solana SPL TransferChecked instruction
4. Sign and send transaction
5. Retry with X-Payment header (base64 encoded envelope)
6. Return 200 response + tx metadata
```

## Code Quality
- TypeScript, follow Activepieces piece conventions
- Proper error handling
- No Chinese in code

## Important
- Study the http-piece for HTTP call patterns
- The piece should be self-contained
- Use the Activepieces piece naming convention
- Commit with clear messages
