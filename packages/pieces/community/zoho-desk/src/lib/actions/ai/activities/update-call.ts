import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUpdateCallOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateCallAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_call',
	outputSchema: zohoDeskUpdateCallOutputSchema,
	displayName: 'Update Call',
	description: 'Updates fields on a call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates only the fields you set on one call; the rest keep their current values. Needs the Desk.calls.ALL scope.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		callId: Property.ShortText({
			displayName: 'Call ID',
			description: 'Call ID (from List Calls or Search Calls).',
			required: true,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Call subject.',
			required: false,
		}),
		contactId: zohoDeskAiProps.contactId({ required: false }),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		ticketId: zohoDeskAiProps.ticketId({
			required: false,
			description: 'Ticket the call belongs to (from List Tickets).',
		}),
		startTime: Property.DateTime({
			displayName: 'Start Time',
			description: 'Start time, ISO 8601.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Call status. A Completed call needs a start time in the past.',
			required: false,
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
			required: false,
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
			callId,
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
		return await zohoDeskApi.updateCall({
			auth: context.auth,
			orgId,
			callId,
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
