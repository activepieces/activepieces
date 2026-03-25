import {
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import { getVersion } from './api';

export type MatomoAuthType = {
  tokenAuth: string;
  domain: string;
  siteId: string;
};

const description = `
Authenticate with Matomo.

Your Matomo domain is the URL of your Matomo account, e.g. https://matomo.example.com

Your Token Auth key can be found in your Matomo account under Settings > API.

Your Site ID can be found in your Matomo account under Administration > Websites.
`;

export const matomoAuth = PieceAuth.CustomAuth({
  description: description,
  props: {
    domain: Property.ShortText({
      displayName: 'Matomo Domain',
      description:
        'The domain of your Matomo account: https://matomo.example.com',
      required: true,
    }),
    tokenAuth: PieceAuth.SecretText({
      displayName: 'Token Auth',
      description: 'The Token Auth key from your Matomo account',
      required: true,
    }),
    siteId: Property.ShortText({
      displayName: 'Site ID',
      description:
        'The site ID that will be associated to this connection. Site IDs can be found on the main Websites page.',
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

const validateAuth = async (auth: MatomoAuthType) => {
  await propsValidation.validateZod(auth, {
    domain: z.string().url(),
    tokenAuth: z.string().regex(/^[a-zA-Z0-9]+$/),
    siteId: z.string().regex(/^[0-9]+$/),
  });

  const response = await getVersion(auth);
  if (response.success !== true) {
    throw new Error(
      'Authentication failed. Please check your setup and try again.'
    );
  }
};
