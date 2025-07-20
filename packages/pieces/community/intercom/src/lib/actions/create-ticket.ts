import { intercomAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';
import {
	companyIdProp,
	contactIdProp,
	ticketPropertiesProp,
	ticketTypeIdProp,
} from '../common/props';
import dayjs from 'dayjs';

export const createTicketAction = createAction({
	auth: intercomAuth,
	name: 'create-ticket',
	displayName: 'Create Ticket',
	description: 'Creates a new ticket.',
	props: {
		ticketTypeId: ticketTypeIdProp('Ticket Type', true),
		contactId: contactIdProp('Contact ID', null, true),
		companyId: companyIdProp('Company ID', false),
		ticketProperties: ticketPropertiesProp('Ticket Properties', true),
	},
	async run(context) {
		const { ticketTypeId, contactId, companyId } = context.propsValue;
		const ticketProperties = context.propsValue.ticketProperties ?? {};

		if (!ticketTypeId) {
			throw new Error('Ticket Type is required');
		}

		if (!contactId) {
			throw new Error('Contact ID is required');
		}

		const client = intercomClient(context.auth);

		const formattedProperties: Record<string, any> = {};
		for (const key in ticketProperties) {
			const value = ticketProperties[key];

			// Check if value is a valid date string and convert it to a timestamp
			if (typeof value === 'string' && dayjs(value).isValid()) {
				formattedProperties[key] = dayjs(value).unix(); // Convert to timestamp
			} else {
				formattedProperties[key] = value;
			}
		}
		const response = await client.tickets.create({
			ticket_type_id: ticketTypeId,
			contacts: [{ id: contactId }],
			company_id: companyId,
			ticket_attributes: formattedProperties,
		});

		return response;
	},
});
