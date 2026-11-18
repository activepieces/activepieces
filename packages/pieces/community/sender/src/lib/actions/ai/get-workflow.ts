import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderGetWorkflowOutputSchema } from '../../output-schemas';

export const senderGetWorkflowAction = createAction({
	auth: senderAuth,
	name: 'sender_get_workflow',
	outputSchema: senderGetWorkflowOutputSchema,
	displayName: 'Get Workflow',
	description: 'Gets an automation workflow by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one automation workflow by ID, with its status, description and email performance.',
		idempotent: true,
	},
	props: {
		workflowId: senderAiProps.workflowId({ required: true }),
	},
	async run(context) {
		return await senderApi.getWorkflow({ auth: context.auth, ...context.propsValue });
	},
});
