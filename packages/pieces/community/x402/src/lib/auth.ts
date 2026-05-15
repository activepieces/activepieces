import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdown = `
x402 enables AI workflows to call paid external APIs using HTTP 402 payment protocol.

**Note**: You need a Solana wallet with USDC to pay for API calls.

`;

export const x402Auth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    privateKey: PieceAuth.SecretText({
      displayName: 'Solana Wallet Private Key',
      description: 'Base58 encoded private key for Solana wallet',
      required: true,
    }),
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'Solana network to use for transactions',
      required: true,
      options: {
        options: [
          { label: 'Mainnet Beta', value: 'mainnet-beta' },
          { label: 'Devnet', value: 'devnet' },
          { label: 'Testnet', value: 'testnet' },
        ],
        defaultValue: 'mainnet-beta',
      },
    }),
  },
});
