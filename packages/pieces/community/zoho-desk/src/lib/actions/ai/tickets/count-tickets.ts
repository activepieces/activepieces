import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCountAgentsOutputSchema } from '../../../output-schemas';

export const zohoDeskCountTicketsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_count_tickets',
	outputSchema: zohoDeskCountAgentsOutputSchema,
	displayName: 'Count Tickets',
	description: 'Counts tickets matching filters.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns the number of tickets matching the filters (department, contact, assignee, category, created or modified time range), without returning the tickets.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		contactId: zohoDeskAiProps.contactId({ required: false }),
		assigneeId: Property.ShortText({
			displayName: 'Assignee ID',
			description: 'Agent ID (from List Agents).',
			required: false,
		}),
		category: Property.ShortText({
			displayName: 'Category',
			description: 'Ticket category.',
			required: false,
		}),
		createdTimeRange: Property.ShortText({
			displayName: 'Created Time Range',
			description: 'Two ISO 8601 times separated by a comma.',
			required: false,
		}),
		modifiedTimeRange: Property.ShortText({
			displayName: 'Modified Time Range',
			description: 'Two ISO 8601 times separated by a comma.',
			required: false,
		}),
	},
	async run(context) {
		const {
			orgId,
			departmentId,
			contactId,
			assigneeId,
			category,
			createdTimeRange,
			modifiedTimeRange,
		} = context.propsValue;
		return await zohoDeskApi.countTickets({
			auth: context.auth,
			orgId,
			departmentId,
			contactId,
			assigneeId,
			category,
			createdTimeRange,
			modifiedTimeRange,
		});
	},
});
