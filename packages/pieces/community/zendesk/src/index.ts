import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { zendeskAuth } from './lib/auth';
import { getZendeskAuthorizationHeader, getZendeskBaseUrl } from './lib/common/client';
import { newTicketInView } from './lib/trigger/new-ticket-in-view';
import { newTicket } from './lib/trigger/new-ticket';
import { updatedTicket } from './lib/trigger/updated-ticket';
import { tagAddedToTicket } from './lib/trigger/tag-added-to-ticket';
import { newOrganization } from './lib/trigger/new-organization';
import { newUser } from './lib/trigger/new-user';
import { newSuspendedTicket } from './lib/trigger/new-suspended-ticket';
import { newActionOnTicket } from './lib/trigger/new-action-on-ticket';
import { newGroup } from './lib/trigger/new-group';
import { tagAddedToUser } from './lib/trigger/tag-added-to-user';
import { createTicketAction } from './lib/actions/create-ticket';
import { updateTicketAction } from './lib/actions/update-ticket';
import { addTagToTicketAction } from './lib/actions/add-tag-to-ticket';
import { removeTagFromTicketAction } from './lib/actions/remove-tag-from-ticket';
import { attachFileToTicketAction } from './lib/actions/attach-file-to-ticket';
import { addCommentToTicketAction } from './lib/actions/add-comment-to-ticket';
import { createOrganizationAction } from './lib/actions/create-organization';
import { updateOrganizationAction } from './lib/actions/update-organization';
import { createUserAction } from './lib/actions/create-user';
import { deleteUserAction } from './lib/actions/delete-user';
import { findOrganizationAction } from './lib/actions/find-organization';
import { findTicketsAction } from './lib/actions/find-tickets';
import { findUserAction } from './lib/actions/find-user';
import { findAgentAction } from './lib/actions/find-agent';
import { findGroupAction } from './lib/actions/find-group';
import { findLatestCommentAction } from './lib/actions/find-latest-comment';
import { updateUserAction } from './lib/actions/update-user';

export const zendesk = createPiece({
  displayName: 'Zendesk',
  description: 'Customer service software and support ticket system',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/zendesk.png',
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud","aryel780","onyedikachi-david","murex971"],
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  auth: zendeskAuth,
  actions: [
    createTicketAction,
    updateTicketAction,
    addTagToTicketAction,
    removeTagFromTicketAction,
    attachFileToTicketAction,
    addCommentToTicketAction,
    createOrganizationAction,
    updateOrganizationAction,
    createUserAction,
    deleteUserAction,
    findOrganizationAction,
    findTicketsAction,
    findUserAction,
    findAgentAction,
    findGroupAction,
    findLatestCommentAction,
    updateUserAction,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? getZendeskBaseUrl(auth) : ''),
      auth: zendeskAuth,
      authMapping: async (auth) => ({
        Authorization: getZendeskAuthorizationHeader(auth),
      }),
    }),
  ],
  triggers: [newTicketInView, newTicket, updatedTicket, tagAddedToTicket, newOrganization, newUser, newSuspendedTicket, newActionOnTicket, newGroup, tagAddedToUser],
});
