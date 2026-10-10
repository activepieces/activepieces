import { createAction } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';
import { runwareGetUsageErrorsOutputSchema } from '../../output-schemas';

export const getUsageErrorsAction = createAction({
	auth: runwareAuth,
	name: 'runware_get_usage_errors',
	outputSchema: runwareGetUsageErrorsOutputSchema,
	displayName: 'Get Usage Errors',
	description: 'Gets client and server error counts over a date range.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns client (4xx) and server (5xx) error counts for a date window of up to 30 days, optionally per day, model or API key name (Group By). Filter by model AIR IDs.',
		idempotent: true,
	},
	props: runwareAiProps.usageWindow(),
	async run({ auth, propsValue }) {
		return await runwareApi.runTask({
			auth,
			task: { taskType: 'accountManagement', operation: 'getUsageErrors', ...propsValue },
		});
	},
});
