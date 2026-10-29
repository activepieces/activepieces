import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListCallCommentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListTaskCommentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_task_comments',
	outputSchema: zohoDeskListCallCommentsOutputSchema,
	displayName: 'List Task Comments',
	description: 'Lists the comments on a task.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the comments on one task (agent notes).', idempotent: true },
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
		const comments = await zohoDeskApi.listTaskComments({
			auth: context.auth,
			orgId,
			taskId,
			from,
			limit,
		});
		return { comments, count: comments.length };
	},
});
