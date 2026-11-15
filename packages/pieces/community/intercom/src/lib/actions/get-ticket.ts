import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomRequest } from '../common';
import { requireText } from '../common/lookups';
import { ticketOutputSchema } from '../output-schemas';

export const getTicketAction = createAction({
	auth: intercomAuth,
	name: 'get_ticket',
	classification: 'READ',
	displayName: 'Get Ticket',
	description: 'Gets one ticket by its ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Gets one ticket by its API ID (the ticket "id", not the inbox ticket number shown to teammates). Use Search Tickets when you only know the contact, type or title. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		ticketId: Property.ShortText({
			displayName: 'Ticket ID',
			description: 'The ticket "id" from Intercom, not the inbox ticket number.',
			required: true,
		}),
	},
	outputSchema: ticketOutputSchema,
	async run(context) {
		const ticketId = requireText({ label: 'Ticket ID', value: context.propsValue.ticketId });
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: ['tickets', ticketId],
			operation: 'get the ticket',
		});
	},
});
