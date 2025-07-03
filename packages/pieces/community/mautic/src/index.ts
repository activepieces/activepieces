import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  PiecePropValueSchema,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  createCompany,
  createContact,
  searchCompany,
  searchContact,
  updateCompany,
  updateContact,
} from './lib/actions';
import { triggers } from './lib/triggers';

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
  description: 'Open-source marketing automation software',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mautic.png',
  authors: ["bibhuty-did-this","kanarelo","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  categories: [PieceCategory.MARKETING],
  auth: mauticAuth,
  actions: [
    createContact,
    searchContact,
    updateContact,
    createCompany,
    searchCompany,
    updateCompany,
    createCustomApiCallAction({
      auth: mauticAuth,
      baseUrl: (auth) => {
        const { base_url } = auth as PiecePropValueSchema<typeof mauticAuth>;
        return `${base_url.endsWith('/') ? base_url : base_url + '/'}api/`;
      },
      authMapping: async (auth) => {
        const { username, password } = auth as PiecePropValueSchema<
          typeof mauticAuth
        >;
        return {
          Authorization:
            'Basic ' +
            Buffer.from(`${username}:${password}`).toString('base64'),
          'Content-Type': 'application/json',
        };
      },
    }),
  ],
  triggers,
});
