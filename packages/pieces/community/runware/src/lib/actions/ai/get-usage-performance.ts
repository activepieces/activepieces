import { createAction } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';
import { runwareGetUsagePerformanceOutputSchema } from '../../output-schemas';

export const getUsagePerformanceAction = createAction({
	auth: runwareAuth,
	name: 'runware_get_usage_performance',
	outputSchema: runwareGetUsagePerformanceOutputSchema,
	displayName: 'Get Usage Performance',
	description: 'Gets per-model inference-time percentiles over a date range.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns per-model inference-time percentiles for a date window of up to 30 days, optionally per day or per API key name (Group By). Filter by model AIR IDs.',
		idempotent: true,
	},
	props: runwareAiProps.usageWindow(),
	async run({ auth, propsValue }) {
		return await runwareApi.runTask({
			auth,
			task: { taskType: 'accountManagement', operation: 'getUsagePerformance', ...propsValue },
		});
	},
});
