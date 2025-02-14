import { intercomAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { commonProps, intercomClient } from '../common';
import { ticketIdProp, ticketPropertiesProp, ticketTypeIdProp } from '../common/props';
import { UpdateTicketRequest } from 'intercom-client/api';

import dayjs from 'dayjs';

export const updateTicketAction = createAction({
	auth: intercomAuth,
	name: 'update-ticket',
	displayName: 'Update Ticket',
	description: 'Updates an existing ticket.',
	props: {
		ticketTypeId: ticketTypeIdProp('Ticket Type', true),
		ticketId: ticketIdProp('Ticket', true),
		ticketProperties: ticketPropertiesProp('Ticket Properties', true),
		isOpen: Property.Checkbox({
			displayName: 'Is Open',
			required: false,
		}),
		state: Property.StaticDropdown({
			displayName: 'State',
			required: false,
			options: {
				disabled: false,
				options: [
					{
						value: 'in_progress',
						label: 'In Progress',
					},
					{
						value: 'waiting_on_customer',
						label: 'Waiting on Customer',
					},
					{
						value: 'resolved',
						label: 'Resolved',
					},
				],
			},
		}),
		snoozedTill: Property.DateTime({
			displayName: 'Snoozed Until',
			required: false,
		}),
		assignedAdminId: commonProps.admins({ displayName: 'Assigned Admin', required: false }),
	},
	async run(context) {
		const { ticketTypeId, ticketId, isOpen, state, snoozedTill, assignedAdminId } =
			context.propsValue;
		const ticketProperties = context.propsValue.ticketProperties ?? {};

		if (!ticketTypeId) {
			throw new Error('Ticket Type is required');
		}

		if (!ticketId) {
			throw new Error('Ticket ID is required');
		}

		const client = intercomClient(context.auth);

		const request: UpdateTicketRequest = {
			ticket_id: ticketId,
			open: isOpen,
			state: state as 'in_progress' | 'waiting_on_customer' | 'resolved' | undefined,
		};

		if (snoozedTill) {
			request.snoozed_until = dayjs(snoozedTill).unix();
		}
		if (assignedAdminId) {
			const admin = await client.admins.identify();
			request.assignment = {
				assignee_id: assignedAdminId,
				admin_id: admin.id,
			};
		}

		if (Object.keys(ticketProperties).length > 0) {
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
			request.ticket_attributes = formattedProperties;
		}

		const response = await client.tickets.update(request);

		return response;
	},
});
