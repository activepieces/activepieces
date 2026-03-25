import {
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { getProducts } from './api';

export type CartloomAuthType = { apiKey: string; domain: string };

export const cartloomAuth = PieceAuth.CustomAuth({
  description: 'Cartloom Authentication',
  props: {
    domain: Property.ShortText({
      displayName: 'Cartloom Domain',
      description:
        'Your cartloom domain will be the subdomain part of your Cartloom URL. Example: https://<strong>mycompany</strong>.cartloom.com',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'The API key for your Cartloom account',
      required: true
    }),
  },
  validate: async ({ auth }) => {
    try {
      await validateAuth(auth);
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: (e as Error)?.message,
      };
    }
  },
  required: true,
});

const validateAuth = async (auth: CartloomAuthType) => {
  const response = await getProducts(auth);
  if (response.success !== true) {
    throw new Error(
      'Authentication failed. Please check your domain and API key and try again.'
    );
  }
};
