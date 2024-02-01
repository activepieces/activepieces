import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { newTicketInView } from './lib/trigger/new-ticket-in-view';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

const markdownProperty = `
**Organization**: The organization name can be found in the URL (e.g https://ORGANIZATION_NAME.zendesk.com).

**Agent Email**: The email you use to log in to Zendesk.

**API Token**: You can find this in the Zendesk Admin Panel under Settings > APIs > Zendesk API.
`;

export const zendeskAuth = PieceAuth.CustomAuth({
  description: markdownProperty,
  props: {
    email: Property.ShortText({
      displayName: 'Agent Email',
      description: 'The email address you use to login to Zendesk',
      required: true,
    }),
    token: Property.ShortText({
      displayName: 'Token',
      description: 'The API token you can generate in Zendesk',
      required: true,
    }),
    subdomain: Property.ShortText({
      displayName: 'Organization (e.g activepieceshelp)',
      description: 'The subdomain of your Zendesk instance',
      required: true,
    }),
  },
  required: true,
});

export const zendesk = createPiece({
  displayName: 'Zendesk',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/zendesk.png',
  authors: ['abuaboud'],
  categories: [PieceCategory.CUSTOMER_SERVICE],
  auth: zendeskAuth,
  actions: [
    createCustomApiCallAction({
      baseUrl: (auth) =>
        `https://${
          (auth as { subdomain: string }).subdomain
        }.zendesk.com/api/v2`,
      auth: zendeskAuth,
      authMapping: (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `${(auth as { email: string }).email}/token:${
            (auth as { token: string }).token
          }`
        ).toString('base64')}`,
      }),
    }),
  ],
  triggers: [newTicketInView],
});
