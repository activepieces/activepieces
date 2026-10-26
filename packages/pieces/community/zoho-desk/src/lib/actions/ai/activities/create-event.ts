import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateEventOutputSchema } from '../../../output-schemas';

export const zohoDeskCreateEventAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_create_event',
	outputSchema: zohoDeskCreateEventOutputSchema,
	displayName: 'Create Event',
	description: 'Schedules an event.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Schedules an event (meeting or appointment) with a contact, optionally on a ticket. Not idempotent: each call creates a new event.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Event subject.',
			required: true,
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		departmentId: zohoDeskAiProps.departmentId({ required: true }),
		ticketId: zohoDeskAiProps.ticketId({
			required: false,
			description: 'Ticket the event belongs to (from List Tickets).',
		}),
		startTime: Property.DateTime({
			displayName: 'Start Time',
			description: 'Start time, ISO 8601.',
			required: true,
		}),
		status: Property.ShortText({
			displayName: 'Status',
			description: 'Event status, e.g. "Scheduled" or "Completed".',
			required: false,
		}),
		category: Property.ShortText({
			displayName: 'Category',
			description: 'Event category.',
			required: false,
		}),
		duration: Property.Number({
			displayName: 'Duration',
			description: 'Duration in seconds.',
			required: true,
		}),
		ownerId: Property.ShortText({
			displayName: 'Owner ID',
			description: 'Agent ID who owns it (from List Agents).',
			required: false,
		}),
		priority: Property.ShortText({
			displayName: 'Priority',
			description: 'Priority, e.g. "Low", "Normal" or "High".',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Notes.',
			required: false,
		}),
		customFields: Property.Object({
			displayName: 'Custom Fields',
			description: 'Custom field values keyed by API name.',
			required: false,
		}),
	},
	async run(context) {
		const {
			orgId,
			subject,
			contactId,
			departmentId,
			ticketId,
			startTime,
			status,
			category,
			duration,
			ownerId,
			priority,
			description,
			customFields,
		} = context.propsValue;
		return await zohoDeskApi.createEvent({
			auth: context.auth,
			orgId,
			subject,
			contactId,
			departmentId,
			ticketId,
			startTime,
			status,
			category,
			duration,
			ownerId,
			priority,
			description,
			customFields,
		});
	},
});
