import { intercomAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { intercomRequest } from '../common';
import {
	companyIdProp,
	contactIdProp,
	ticketPropertiesProp,
	ticketTypeIdProp,
} from '../common/props';
import { getTicketTypeAttributes, toTicketAttributes } from '../common/ticket-attributes';
import { ticketOutputSchema } from '../output-schemas';

export const createTicketAction = createAction({
	auth: intercomAuth,
	name: 'create-ticket',
	classification: 'WRITE',
	displayName: 'Create Ticket',
	description: 'Creates a new ticket.',
	audience: 'human',
	aiMetadata: { description: 'Create a new ticket of a given ticket type for a contact, optionally tied to a company, with type-specific ticket attributes (only attributes the ticket type defines as date-time are converted to timestamps; text and list values are sent as given). Always creates a new ticket, so it is not idempotent. To change an existing ticket instead, use Update Ticket.', idempotent: false },
	props: {
		ticketTypeId: ticketTypeIdProp('Ticket Type', true),
		contactId: contactIdProp('Contact ID', null, true),
		companyId: companyIdProp('Company ID', false),
		ticketProperties: ticketPropertiesProp('Ticket Properties', true),
	},
	outputSchema: ticketOutputSchema,
	async run(context) {
		const { ticketTypeId, contactId, companyId } = context.propsValue;
		const ticketProperties = context.propsValue.ticketProperties ?? {};

		if (!ticketTypeId) {
			throw new Error('Ticket Type is required');
		}

		if (!contactId) {
			throw new Error('Contact ID is required');
		}

		const attributes = await getTicketTypeAttributes({ auth: context.auth, ticketTypeId });
		const formattedProperties = toTicketAttributes({ attributes, values: ticketProperties });

		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: ['tickets'],
			body: {
				ticket_type_id: ticketTypeId,
				contacts: [{ id: contactId }],
				company_id: companyId || undefined,
				ticket_attributes: formattedProperties,
			},
			operation: 'create the ticket',
		});
	},
});
