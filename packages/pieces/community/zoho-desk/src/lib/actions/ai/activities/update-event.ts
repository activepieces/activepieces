import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateEventOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateEventAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_event',
	outputSchema: zohoDeskCreateEventOutputSchema,
	displayName: 'Update Event',
	description: 'Updates fields on an event.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates only the fields you set on one event; the rest keep their current values.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		eventId: Property.ShortText({
			displayName: 'Event ID',
			description: 'Event ID (from List Events or Search Events).',
			required: true,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Event subject.',
			required: false,
		}),
		contactId: zohoDeskAiProps.contactId({ required: false }),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		ticketId: zohoDeskAiProps.ticketId({
			required: false,
			description: 'Ticket the event belongs to (from List Tickets).',
		}),
		startTime: Property.DateTime({
			displayName: 'Start Time',
			description: 'Start time, ISO 8601.',
			required: false,
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
			required: false,
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
			eventId,
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
		return await zohoDeskApi.updateEvent({
			auth: context.auth,
			orgId,
			eventId,
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
