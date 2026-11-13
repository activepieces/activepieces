import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderGetWorkflowStatisticsOutputSchema } from '../../output-schemas';

export const senderGetWorkflowStatisticsAction = createAction({
	auth: senderAuth,
	name: 'sender_get_workflow_statistics',
	outputSchema: senderGetWorkflowStatisticsOutputSchema,
	displayName: 'Get Workflow Statistics',
	description: "Gets a workflow's email performance.",
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets an automation workflow's average email performance: sent, opened, clicked, bounced and unsubscribed counts and rates.",
		idempotent: true,
	},
	props: {
		workflowId: senderAiProps.workflowId({ required: true }),
	},
	async run(context) {
		return await senderApi.getWorkflowStatistics({ auth: context.auth, ...context.propsValue });
	},
});
