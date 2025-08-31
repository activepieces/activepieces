import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { newTicketInView } from './lib/trigger/new-ticket-in-view';
import { newTicket } from './lib/trigger/new-ticket';
import { updatedTicket } from './lib/trigger/updated-ticket';
import { tagAddedToTicket } from './lib/trigger/tag-added-to-ticket';
import { newOrganization } from './lib/trigger/new-organization';
import { newUser } from './lib/trigger/new-user';
import { newSuspendedTicket } from './lib/trigger/new-suspended-ticket';
import { newActionOnTicket } from './lib/trigger/new-action-on-ticket';
import { createTicketAction } from './lib/actions/create-ticket';
import { updateTicketAction } from './lib/actions/update-ticket';
import { addTagToTicketAction } from './lib/actions/add-tag-to-ticket';
import { addCommentToTicketAction } from './lib/actions/add-comment-to-ticket';
import { createOrganizationAction } from './lib/actions/create-organization';
import { updateOrganizationAction } from './lib/actions/update-organization';
import { createUserAction } from './lib/actions/create-user';
import { deleteUserAction } from './lib/actions/delete-user';
import { findOrganizationAction } from './lib/actions/find-organization';
import { findTicketsAction } from './lib/actions/find-tickets';
import { findUserAction } from './lib/actions/find-user';

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
  description: 'Customer service software and support ticket system',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/zendesk.png',
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud","aryel780","onyedikachi-david"],
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  auth: zendeskAuth,
  actions: [
    createTicketAction,
    updateTicketAction,
    addTagToTicketAction,
    addCommentToTicketAction,
    createOrganizationAction,
    updateOrganizationAction,
    createUserAction,
    deleteUserAction,
    findOrganizationAction,
    findTicketsAction,
    findUserAction,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        `https://${
          (auth as { subdomain: string }).subdomain
        }.zendesk.com/api/v2`,
      auth: zendeskAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `${(auth as { email: string }).email}/token:${
            (auth as { token: string }).token
          }`
        ).toString('base64')}`,
      }),
    }),
  ],
  triggers: [newTicketInView, newTicket, updatedTicket, tagAddedToTicket, newOrganization, newUser, newSuspendedTicket, newActionOnTicket],
});
