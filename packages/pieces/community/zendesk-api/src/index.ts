
    import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createTicket } from './lib/actions/create-ticket';
import { updateTicket } from './lib/actions/update-ticket';
import { addTagToTicket } from './lib/actions/add-tag-to-ticket';
import { addCommentToTicket } from './lib/actions/add-comment-to-ticket';
import { createOrganization } from './lib/actions/create-organization';
import { updateOrganization } from './lib/actions/update-organization';
import { createUser } from './lib/actions/create-user';
import { deleteUser } from './lib/actions/delete-user';
import { findTickets } from './lib/actions/find-tickets';

    const markdownProperty = `
    **Organization**: The organization name can be found in the URL (e.g https://ORGANIZATION_NAME.zendesk.com).

    **Agent Email**: The email you use to log in to Zendesk.

    **API Token**: You can find this in the Zendesk Admin Panel under Settings > APIs > Zendesk API.
    `;

    export const zendeskApiAuth = PieceAuth.CustomAuth({
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

    export const zendeskApi = createPiece({
      displayName: "Zendesk API",
      description: "Zendesk API integration for custom operations",
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/zendesk-api.png",
      authors: [],
      categories: [PieceCategory.CUSTOMER_SUPPORT],
      auth: zendeskApiAuth,
      actions: [
        createTicket,
        updateTicket,
        addTagToTicket,
        addCommentToTicket,
        createOrganization,
        updateOrganization,
        createUser,
        deleteUser,
        findTickets,
        createCustomApiCallAction({
          baseUrl: (auth) =>
            `https://${
              (auth as { subdomain: string }).subdomain
            }.zendesk.com/api/v2`,
          auth: zendeskApiAuth,
          authMapping: async (auth) => ({
            Authorization: `Basic ${Buffer.from(
              `${(auth as { email: string }).email}/token:${
                (auth as { token: string }).token
              }`
            ).toString('base64')}`,
          }),
        }),
      ],
      triggers: [],
    });
    