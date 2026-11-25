import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetTaskOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTaskAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_task',
	outputSchema: zohoDeskGetTaskOutputSchema,
	displayName: 'Get Task',
	description: 'Gets a task by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one task by ID with its subject, status, owner, due date, linked ticket and custom fields.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		taskId: zohoDeskAiProps.taskId({ required: true }),
	},
	async run(context) {
		const { orgId, taskId } = context.propsValue;
		return await zohoDeskApi.getTask({ auth: context.auth, orgId, taskId });
	},
});
