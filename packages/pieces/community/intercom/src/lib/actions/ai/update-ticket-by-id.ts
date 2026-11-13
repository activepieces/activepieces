import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../../auth';
import { intercomRequest } from '../../common';
import { resolveAdminId } from '../../common/client';
import { requireText, toUnixSeconds } from '../../common/lookups';
import { getTicketTypeAttributes, toTicketAttributes } from '../../common/ticket-attributes';
import { ticketOutputSchema } from '../../output-schemas';

export const updateTicketByIdAction = createAction({
	auth: intercomAuth,
	name: 'update_ticket_by_id',
	classification: 'WRITE',
	displayName: 'Update Ticket (by ID)',
	description: "Changes a ticket's state, assignee, snooze time or attributes.",
	audience: 'ai',
	aiMetadata: {
		description:
			"Changes a ticket's state, open flag, shared flag, assignee, snooze time or attributes by ticket ID (the API id, not the inbox number). Omitted fields stay as they are; an attribute set to null is cleared. Setting the same values again changes nothing, so it is safe to retry.",
		idempotent: true,
	},
	props: {
		ticketId: Property.ShortText({
			displayName: 'Ticket ID',
			description: 'The ticket "id" from Intercom, not the inbox ticket number.',
			required: true,
		}),
		state: Property.StaticDropdown({
			displayName: 'State',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'In Progress', value: 'in_progress' },
					{ label: 'Waiting on Customer', value: 'waiting_on_customer' },
					{ label: 'Resolved', value: 'resolved' },
				],
			},
		}),
		open: Property.StaticDropdown({
			displayName: 'Open or Closed',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Open', value: 'open' },
					{ label: 'Closed', value: 'closed' },
				],
			},
		}),
		isShared: Property.StaticDropdown({
			displayName: 'Visible to Customer',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Shared', value: 'shared' },
					{ label: 'Not Shared', value: 'not_shared' },
				],
			},
		}),
		snoozedUntil: Property.DateTime({
			displayName: 'Snooze Until',
			required: false,
		}),
		assigneeId: Property.ShortText({
			displayName: 'Assignee Admin ID',
			description: 'Assign the ticket to this admin (see List Admins). Use 0 to unassign.',
			required: false,
		}),
		adminId: Property.ShortText({
			displayName: 'Acting Admin ID',
			description: 'The admin who makes the assignment. Leave empty to use the admin who owns this connection.',
			required: false,
		}),
		attributes: Property.Object({
			displayName: 'Attributes',
			description: 'Ticket attributes by name; null clears one. Dates take ISO 8601; list attributes take the option ID.',
			required: false,
		}),
	},
	outputSchema: ticketOutputSchema,
	async run(context) {
		const ticketId = requireText({ label: 'Ticket ID', value: context.propsValue.ticketId });
		const { state, open, isShared, snoozedUntil, attributes } = context.propsValue;
		const assigneeId = context.propsValue.assigneeId?.trim() || undefined;
		const hasAttributes = attributes !== undefined && attributes !== null && Object.keys(attributes).length > 0;

		const body: Record<string, unknown> = {
			...(state ? { state } : {}),
			...(open ? { open: open === 'open' } : {}),
			...(isShared ? { is_shared: isShared === 'shared' } : {}),
			...(snoozedUntil ? { snoozed_until: toUnixSeconds({ label: 'Snooze Until', value: snoozedUntil }) } : {}),
		};
		if (Object.keys(body).length === 0 && assigneeId === undefined && !hasAttributes) {
			throw new Error('Nothing to update. Set at least one field.');
		}
		if (assigneeId !== undefined) {
			body['assignment'] = {
				admin_id: await resolveAdminId({ auth: context.auth, adminId: context.propsValue.adminId }),
				assignee_id: assigneeId,
			};
		}
		if (hasAttributes) {
			const ticket = await intercomRequest<{ ticket_type?: { id?: string } }>({
				auth: context.auth,
				method: HttpMethod.GET,
				path: ['tickets', ticketId],
				operation: 'get the ticket',
			});
			const ticketTypeId = ticket.ticket_type?.id;
			const definitions = ticketTypeId
				? await getTicketTypeAttributes({ auth: context.auth, ticketTypeId: String(ticketTypeId) })
				: [];
			body['ticket_attributes'] = toTicketAttributes({ attributes: definitions, values: attributes });
		}
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.PUT,
			path: ['tickets', ticketId],
			body,
			operation: 'update the ticket',
		});
	},
});
