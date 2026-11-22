import {
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';
import { matomoApi } from './api';


const description = `
Authenticate with Matomo.

Matomo Domain: the address you open Matomo at, e.g. matomo.example.com with https:// in front.

Token Auth: in Matomo go to Administration → Personal → Security → Auth tokens → Create new token. Matomo shows the token only once, so copy it right away. If your Matomo runs on plain http, untick 'Only allow secure requests' when creating the token.

Site ID: the number shown for your website under Administration → Websites → Manage.
`;

export const matomoAuth = PieceAuth.CustomAuth({
  description: description,
  props: {
    domain: Property.ShortText({
      displayName: 'Matomo Domain',
      description:
        'The address of your Matomo, starting with http:// or https://.',
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
        error: e instanceof Error ? e.message : 'Could not connect to Matomo. Check the domain, token and site ID.',
      };
    }
  },
  required: true,
});

const validateAuth = async (auth: MatomoAuthType) => {
  if (!/^https?:\/\//i.test(auth.domain.trim())) {
    throw new Error('Matomo Domain must start with http:// or https://');
  }
  try {
    await propsValidation.validateZod(auth, {
      domain: z.string().check(z.url()),
      tokenAuth: z.string().check(z.regex(/^[a-zA-Z0-9]+$/)),
      siteId: z.string().check(z.regex(/^[0-9]+$/)),
    });
  } catch {
    throw new Error('Invalid connection details: the domain must be a full URL (https://matomo.example.com), the token must be letters and digits only, and the site ID must be a number.');
  }
  try {
    await matomoApi.call({ auth, method: 'SitesManager.getSiteFromId', idSite: auth.siteId });
  } catch (e) {
    const detail = e instanceof Error ? e.message : '';
    throw new Error(`Could not connect to Matomo with this token and site ID. ${detail}`.trim());
  }
};

export type MatomoAuthType = {
  tokenAuth: string;
  domain: string;
  siteId: string;
};
