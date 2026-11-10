import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateCallOutputSchema } from '../../../output-schemas';

export const zohoDeskCreateCallAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_create_call',
	outputSchema: zohoDeskCreateCallOutputSchema,
	displayName: 'Create Call',
	description: 'Logs or schedules a call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Logs a call on a ticket, or schedules one (status Scheduled). Needs the Desk.calls.ALL scope. Not idempotent: each call creates a new record.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Call subject.',
			required: true,
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		departmentId: zohoDeskAiProps.departmentId({ required: true }),
		ticketId: zohoDeskAiProps.ticketId({
			required: true,
			description: 'Ticket the call belongs to (from List Tickets).',
		}),
		startTime: Property.DateTime({
			displayName: 'Start Time',
			description: 'Start time, ISO 8601.',
			required: true,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Call status. A Completed call needs a start time in the past.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Scheduled', value: 'Scheduled' },
					{ label: 'In Progress', value: 'In Progress' },
					{ label: 'Completed', value: 'Completed' },
					{ label: 'Missed', value: 'Missed' },
					{ label: 'Canceled', value: 'Canceled' },
				],
			},
		}),
		direction: Property.StaticDropdown({
			displayName: 'Direction',
			description: 'Inbound or outbound call. Scheduled calls must be outbound.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'inbound', value: 'inbound' },
					{ label: 'outbound', value: 'outbound' },
				],
			},
		}),
		duration: Property.Number({
			displayName: 'Duration',
			description: 'Duration in seconds.',
			required: true,
		}),
		ownerId: Property.ShortText({
			displayName: 'Owner ID',
			description: 'Agent ID who owns it (from List Agents).',
			required: true,
		}),
		priority: Property.ShortText({
			displayName: 'Priority',
			description: 'Priority, e.g. "Low", "Normal" or "High".',
			required: true,
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
			direction,
			duration,
			ownerId,
			priority,
			description,
			customFields,
		} = context.propsValue;
		return await zohoDeskApi.createCall({
			auth: context.auth,
			orgId,
			subject,
			contactId,
			departmentId,
			ticketId,
			startTime,
			status,
			direction,
			duration,
			ownerId,
			priority,
			description,
			customFields,
		});
	},
});
