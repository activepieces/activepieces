import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { stkPush } from './lib/actions/stk-push';

export const mpesaAuth = PieceAuth.CustomAuth({
  description: 'Enter your Daraja API credentials from developer.safaricom.co.ke',
  required: true,
  props: {
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Select sandbox for testing or production for live payments',
      required: true,
      options: {
        options: [
          { label: 'Sandbox', value: 'sandbox' },
          { label: 'Production', value: 'production' },
        ],
      },
    }),
    consumerKey: Property.ShortText({
      displayName: 'Consumer Key',
      required: true,
    }),
    consumerSecret: PieceAuth.SecretText({
      displayName: 'Consumer Secret',
      required: true,
    }),
    shortCode: Property.ShortText({
      displayName: 'Business Short Code',
      required: true,
    }),
    passkey: PieceAuth.SecretText({
      displayName: 'Passkey',
      required: true,
    }),
  },
});

export const mpesa = createPiece({
  displayName: 'M-Pesa',
  description: "Accept and send payments via M-Pesa, East Africa's leading mobile money platform",
  auth: mpesaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/mpesa.png',
  authors: ['justepaix'],
  actions: [stkPush],
  triggers: [],
});