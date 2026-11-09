import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketActivitiesOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketActivitiesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_activities',
	outputSchema: zohoDeskListTicketActivitiesOutputSchema,
	displayName: 'List Ticket Activities',
	description: 'Lists the tasks, calls and events on a ticket.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the activities (tasks, calls and events) linked to one ticket. Use List Ticket Tasks, List Ticket Calls or List Ticket Events for one kind.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		isCompleted: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Completed',
			description: 'Yes returns only completed activities, No only open ones.',
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Sort field.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'activityTime', value: 'activityTime' },
					{ label: 'createdTime', value: 'createdTime' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, ticketId, isCompleted, sortBy, from, limit } = context.propsValue;
		const activities = await zohoDeskApi.listTicketActivities({
			auth: context.auth,
			orgId,
			ticketId,
			isCompleted,
			sortBy,
			from,
			limit,
		});
		return { activities, count: activities.length };
	},
});
