import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskSearchActivitiesOutputSchema } from '../../../output-schemas';

export const zohoDeskSearchActivitiesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_search_activities',
	outputSchema: zohoDeskSearchActivitiesOutputSchema,
	displayName: 'Search Activities',
	description: 'Searches tasks, calls and events together.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Searches tasks, calls and events in one query by free text, subject, linked ticket number, assignee, status, priority or time range.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		searchText: Property.ShortText({
			displayName: 'Search Text',
			description: 'Free text matched across activity fields; end with * for a prefix match.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Text to match in the subject.',
			required: false,
		}),
		ticketNumber: Property.ShortText({
			displayName: 'Ticket Number',
			description: 'Number of the linked ticket.',
			required: false,
		}),
		assigneeId: Property.ShortText({
			displayName: 'Assignee ID',
			description: 'Agent ID (from List Agents).',
			required: false,
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		status: Property.ShortText({ displayName: 'Status', description: 'Status.', required: false }),
		priority: Property.ShortText({
			displayName: 'Priority',
			description: 'Priority.',
			required: false,
		}),
		createdTimeRange: Property.ShortText({
			displayName: 'Created Time Range',
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		modifiedTimeRange: Property.ShortText({
			displayName: 'Modified Time Range',
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const {
			orgId,
			searchText,
			subject,
			ticketNumber,
			assigneeId,
			departmentId,
			status,
			priority,
			createdTimeRange,
			modifiedTimeRange,
			from,
			limit,
		} = context.propsValue;
		const activities = await zohoDeskApi.searchActivities({
			auth: context.auth,
			orgId,
			searchText,
			subject,
			ticketNumber,
			assigneeId,
			departmentId,
			status,
			priority,
			createdTimeRange,
			modifiedTimeRange,
			from,
			limit,
		});
		return { activities, count: activities.length };
	},
});
