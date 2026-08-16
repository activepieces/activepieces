import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { getAccessToken } from './common/client';

export type MpesaEnvironment = 'sandbox' | 'production';

export interface MpesaAuthValue {
  consumerKey: string;
  consumerSecret: string;
  environment: MpesaEnvironment;
  lipaNaMpesaPasskey?: string;
  securityCredential?: string;
}

export function mpesaAuthValue(connection: { props: { consumerKey: string; consumerSecret: string; environment: string; lipaNaMpesaPasskey?: string; securityCredential?: string } }): MpesaAuthValue {
  if (connection.props.environment !== 'sandbox' && connection.props.environment !== 'production') {
    throw new Error('M-Pesa environment must be Sandbox or Production.');
  }
  return { ...connection.props, environment: connection.props.environment };
}

export const mpesaAuth = PieceAuth.CustomAuth({
  displayName: 'M-Pesa Daraja API',
  description: 'Use credentials from the Safaricom Daraja developer portal. Start with Sandbox, then switch to Production after your app is approved.',
  required: true,
  props: {
    consumerKey: PieceAuth.SecretText({
      displayName: 'Consumer Key',
      required: true,
    }),
    consumerSecret: PieceAuth.SecretText({
      displayName: 'Consumer Secret',
      required: true,
    }),
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      required: true,
      defaultValue: 'sandbox',
      options: {
        options: [
          { label: 'Sandbox', value: 'sandbox' },
          { label: 'Production', value: 'production' },
        ],
      },
    }),
    lipaNaMpesaPasskey: PieceAuth.SecretText({
      displayName: 'Lipa na M-Pesa Passkey',
      description: 'Required only for M-Pesa Express (STK Push).',
      required: false,
    }),
    securityCredential: PieceAuth.SecretText({
      displayName: 'B2C/B2B Security Credential',
      description: 'Encrypted initiator password required only for B2C and B2B.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await getAccessToken(mpesaAuthValue({ props: auth }));
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid M-Pesa credentials or environment.',
      };
    }
  },
});
