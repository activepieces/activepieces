import {
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import { getAuthToken } from './api';

export type BettermodeAuthType = {
  region: string;
  domain: string;
  email: string;
  password: string;
  token?: string;
  memberId?: string;
};

export const bettermodeAuth = PieceAuth.CustomAuth({
  description:
    'Your domain should be the base URL of your Bettermode community. Example: community.example.com',
  props: {
    region: Property.StaticDropdown({
      displayName: 'Region',
      description: 'The region of your Bettermode account',
      required: true,
      options: {
        options: [
          { label: 'US Region', value: 'https://api.bettermode.com' },
          { label: 'EU Region', value: 'https://api.bettermode.de' },
        ],
      },
    }),
    domain: Property.ShortText({
      displayName: 'BetterMode Domain',
      description: 'The domain of your Bettermode account',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address for your Bettermode account',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Password for your Bettermode account',
      required: true,
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

const validateAuth = async (auth: BettermodeAuthType) => {
  await propsValidation.validateZod(auth, {
    domain: z.string().url(),
    email: z.string().email(),
  });

  const response = await getAuthToken(auth);
  if (!response.memberId) {
    throw new Error(
      'Authentication failed. Please check your credentials and try again.'
    );
  }
};
