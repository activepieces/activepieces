import { createAction } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareApi } from '../../common/api';
import { runwareGetAccountOutputSchema } from '../../output-schemas';

export const getAccountAction = createAction({
	auth: runwareAuth,
	name: 'runware_get_account',
	outputSchema: runwareGetAccountOutputSchema,
	displayName: 'Get Account',
	description: 'Gets the organization, balance, team, API keys and usage totals.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the Runware organization name and UUID, the current credit balance, the team with roles, the name, masked key and request count of each API key (key UUIDs are not returned), and rolling usage totals (today, last 7 and 30 days, lifetime). Use it to check the balance before paid generations. Takes no inputs.',
		idempotent: true,
	},
	props: {},
	async run({ auth }) {
		return await runwareApi.runTask({
			auth,
			task: { taskType: 'accountManagement', operation: 'getDetails' },
		});
	},
});
