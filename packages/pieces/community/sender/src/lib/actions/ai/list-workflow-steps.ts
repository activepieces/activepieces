import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderListWorkflowStepsOutputSchema } from '../../output-schemas';

export const senderListWorkflowStepsAction = createAction({
	auth: senderAuth,
	name: 'sender_list_workflow_steps',
	outputSchema: senderListWorkflowStepsOutputSchema,
	displayName: 'List Workflow Steps',
	description: 'Lists the steps of an automation workflow.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the steps of an automation workflow (trigger, delays, conditions, emails) as a tree. Large workflows come in batches: when the response includes next_batch, pass it as Batch Number to get the next one.',
		idempotent: true,
	},
	props: {
		workflowId: senderAiProps.workflowId({ required: true }),
		batchNo: Property.Number({
			displayName: 'Batch Number',
			description: 'Zero-based batch to return. Defaults to 0.',
			required: false,
		}),
	},
	async run(context) {
		return await senderApi.listWorkflowSteps({ auth: context.auth, ...context.propsValue });
	},
});
