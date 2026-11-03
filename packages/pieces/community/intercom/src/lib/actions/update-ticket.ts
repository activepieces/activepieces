import { intercomAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { commonProps, intercomRequest } from '../common';
import { resolveAdminId } from '../common/client';
import { ticketIdProp, ticketPropertiesProp, ticketTypeIdProp } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { getTicketTypeAttributes, toTicketAttributes } from '../common/ticket-attributes';
import { ticketOutputSchema } from '../output-schemas';

export const updateTicketAction = createAction({
	auth: intercomAuth,
	name: 'update-ticket',
	classification: 'WRITE',
	displayName: 'Update Ticket',
	description: 'Updates an existing ticket.',
	audience: 'human',
	aiMetadata: { description: 'Modify an existing ticket by ID: change its open flag, state (in progress / waiting on customer / resolved), snooze time, assigned admin, and ticket-type attributes. Updating with the same values converges on the same result, so it is effectively idempotent. To create a new ticket instead, use Create Ticket.', idempotent: true },
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
	outputSchema: ticketOutputSchema,
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

		const assignment = assignedAdminId
			? { assignee_id: assignedAdminId, admin_id: await resolveAdminId({ auth: context.auth, adminId: undefined }) }
			: undefined;

		const ticketAttributes =
			Object.keys(ticketProperties).length > 0
				? toTicketAttributes({
						attributes: await getTicketTypeAttributes({ auth: context.auth, ticketTypeId }),
						values: ticketProperties,
				  })
				: undefined;

		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.PUT,
			path: ['tickets', ticketId],
			body: {
				open: isOpen,
				state: state || undefined,
				snoozed_until: snoozedTill ? dayjs(snoozedTill).unix() : undefined,
				assignment,
				ticket_attributes: ticketAttributes,
			},
			operation: 'update the ticket',
		});
	},
});
