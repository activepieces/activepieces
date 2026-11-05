import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateCallCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTaskCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_task_comment',
	outputSchema: zohoDeskCreateCallCommentOutputSchema,
	displayName: 'Get Task Comment',
	description: 'Gets one comment on a task.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one comment on a task, with its author and content.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		taskId: zohoDeskAiProps.taskId({ required: true }),
		commentId: Property.ShortText({
			displayName: 'Comment ID',
			description: 'Comment ID (from List Task Comments).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, taskId, commentId } = context.propsValue;
		return await zohoDeskApi.getTaskComment({ auth: context.auth, orgId, taskId, commentId });
	},
});
