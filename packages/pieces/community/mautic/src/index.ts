import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import {
  createCompany,
  createContact,
  searchCompany,
  searchContact,
  updateCompany,
  updateContact,
} from './lib/actions';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

const markdownDescription = `
Follow these steps:

1. **Enter the Base URL:** Open your Mautic instance and copy the URL from the address bar. If your dashboard link is "https://mautic.ddev.site/s/dashboard", set your base URL as "https://mautic.ddev.site/".

2. **Enable Basic Authentication:** Log in to Mautic, go to **Settings** > **Configuration** > **API Settings**, and ensure that Basic Authentication is enabled.

`;

export const mauticAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
    }),
  },
  required: true,
});

export const mautic = createPiece({
  displayName: 'Mautic',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mautic.png',
  authors: ['bibhuty-did-this'],
  auth: mauticAuth,
  actions: [
    createContact,
    searchContact,
    updateContact,
    createCompany,
    searchCompany,
    updateCompany,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { base_url: string }).base_url,
      auth: mauticAuth,
      authMapping: (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `${(auth as { username: string }).username}:${
            (auth as { password: string }).password
          }`
        ).toString('base64')}`,
      }),
    }),
  ],
  triggers: [],
});
