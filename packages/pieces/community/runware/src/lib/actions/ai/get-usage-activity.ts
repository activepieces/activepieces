import { createAction } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';
import { runwareGetUsageActivityOutputSchema } from '../../output-schemas';

export const getUsageActivityAction = createAction({
	auth: runwareAuth,
	name: 'runware_get_usage_activity',
	outputSchema: runwareGetUsageActivityOutputSchema,
	displayName: 'Get Usage Activity',
	description: 'Gets request counts and spend over a date range.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns request counts and spend for a date window of up to 30 days, as a per-day timeseries and/or split by model or API key name (Group By). Filter by model AIR IDs.',
		idempotent: true,
	},
	props: runwareAiProps.usageWindow(),
	async run({ auth, propsValue }) {
		return await runwareApi.runTask({
			auth,
			task: { taskType: 'accountManagement', operation: 'getUsageActivity', ...propsValue },
		});
	},
});
