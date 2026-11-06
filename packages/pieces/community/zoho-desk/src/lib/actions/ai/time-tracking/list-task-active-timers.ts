import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketActiveTimersOutputSchema } from '../../../output-schemas';

export const zohoDeskListTaskActiveTimersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_task_active_timers',
	outputSchema: zohoDeskListTicketActiveTimersOutputSchema,
	displayName: 'List Task Active Timers',
	description: "Lists the agents' running timers on a task.",
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the timers agents currently have running or paused on one task.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		taskId: zohoDeskAiProps.taskId({ required: true }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, taskId, from, limit } = context.propsValue;
		const timers = await zohoDeskApi.listTaskActiveTimers({
			auth: context.auth,
			orgId,
			taskId,
			from,
			limit,
		});
		return { timers, count: timers.length };
	},
});
