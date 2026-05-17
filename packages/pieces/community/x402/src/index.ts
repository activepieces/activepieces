import { createPiece } from '@activepieces/pieces-framework';
import { callPaidApi } from './lib/actions/call-paid-api';
import { x402Auth } from './lib/auth';

const markdown = `
x402 enables AI workflows to call paid external APIs using HTTP 402 payment protocol.

**Note**: You need a Solana wallet with USDC to pay for API calls.

`;

export const x402 = createPiece({
  displayName: 'x402 Payment',
  description: 'Enable AI workflows to call paid external APIs using HTTP 402 payment protocol',
  auth: x402Auth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/x402.png',
  authors: ['sunbei597226617'],
  actions: [
    callPaidApi,
  ],
  triggers: [],
});
