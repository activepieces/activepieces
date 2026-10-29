import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetTicketTimerOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTaskTimerAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_task_timer',
	outputSchema: zohoDeskGetTicketTimerOutputSchema,
	displayName: 'Get Task Timer',
	description: "Gets the connected agent's timer on a task.",
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: "Gets the state and elapsed time of the connected agent's timer on one task.",
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
		return await zohoDeskApi.getTaskTimer({ auth: context.auth, orgId, taskId });
	},
});
