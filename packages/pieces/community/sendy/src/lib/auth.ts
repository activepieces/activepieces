import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { getLists } from './api';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';

export type SendyAuthType = AppConnectionValueForAuthProperty<typeof sendyAuth>;

const markdownDescription = `
To connect Sendy:
1. **Sendy Domain**: the address of your Sendy installation, e.g. https://sendy.example.com
2. **API Key**: in Sendy, open **Settings** and copy the API key.
3. **Brand ID**: on the Brands page, the ID is in the first column.
`;

export const sendyAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    domain: Property.ShortText({
      displayName: 'Sendy Domain',
      description: 'The address of your Sendy installation.',
      placeholder: 'https://sendy.example.com',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Found under Settings in Sendy.',
      required: true,
    }),
    brandId: Property.ShortText({
      displayName: 'Brand ID',
      description: 'The brand this connection works with, from the Brands page.',
      placeholder: '1',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await propsValidation.validateZod(auth, {
        domain: z.string().check(z.url()),
        apiKey: z.string().check(z.minLength(1), z.regex(/^\S+$/)),
        brandId: z.string().check(z.regex(/^[0-9]+$/)),
      });
      await validateAuth({
        type: AppConnectionType.CUSTOM_AUTH,
        props: auth,
      });
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

const validateAuth = async (auth: SendyAuthType) => {
  const response = await getLists(auth);
  if (response.success !== true) {
    throw new Error(
      `Authentication failed. Please check your domain and API key and try again. ${response.text}`
    );
  }
};
