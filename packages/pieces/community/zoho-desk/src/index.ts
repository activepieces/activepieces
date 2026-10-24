import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { zohoDeskAuth } from './lib/auth';
import { zohoDeskClient } from './lib/common/client';
import { zohoDeskProps } from './lib/common/props';
import { listTicketsAction } from './lib/actions/list-tickets';
import { createTicketAction } from './lib/actions/create-ticket';
import { findContactAction } from './lib/actions/find-contact';

export const piecesZohoDesk = createPiece({
	displayName: 'Zoho Desk',
	description: 'Helpdesk management software',
	auth: zohoDeskAuth,
	categories: [PieceCategory.CUSTOMER_SUPPORT],
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/zoho-desk.png',
	authors: ['volubile', 'kishanprmr'],
	actions: [
		listTicketsAction,
		createTicketAction,
		findContactAction,
		createCustomApiCallAction({
			baseUrl: (auth) => (auth ? zohoDeskClient.baseUrl({ auth }) : ''),
			auth: zohoDeskAuth,
			authMapping: async (auth) => ({
				Authorization: `Zoho-oauthtoken ${auth.access_token}`,
			}),
			extraProps: {
				orgId: zohoDeskProps.orgId({
					displayName: 'Organization ID',
					description: 'Select organization ID to include in auth headers.',
					required: false,
				}),
			},
		}),
	],
	triggers: [],
});
