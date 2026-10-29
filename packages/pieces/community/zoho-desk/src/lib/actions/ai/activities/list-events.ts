import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskListEventsOutputSchema } from '../../../output-schemas';

export const zohoDeskListEventsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_events',
	outputSchema: zohoDeskListEventsOutputSchema,
	displayName: 'List Events',
	description: 'Lists scheduled events.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists events (meetings and appointments), optionally by department, view, assignee or completion. Page with From and Limit.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		viewId: Property.ShortText({
			displayName: 'View ID',
			description: 'Event view ID (from List Views, module events).',
			required: false,
		}),
		assignee: Property.Array({
			displayName: 'Assignee',
			description: 'Agent IDs to include.',
			required: false,
		}),
		isCompleted: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Completed',
			description: 'Yes returns only completed events, No only open ones.',
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Field to sort by.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'startTime', value: 'startTime' },
					{ label: 'createdTime', value: 'createdTime' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, departmentId, viewId, assignee, isCompleted, sortBy, from, limit } =
			context.propsValue;
		const events = await zohoDeskApi.listEvents({
			auth: context.auth,
			orgId,
			departmentId,
			viewId,
			assignee: zohoDeskUtils.optionalStringList({ value: assignee, propName: 'Assignee' }),
			isCompleted,
			sortBy,
			from,
			limit,
		});
		return { events, count: events.length };
	},
});
