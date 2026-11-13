import { createAction } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegrapghaiMonitorOutputSchema } from '../../output-schemas';

export const getMonitorAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_get_monitor',
	outputSchema: scrapegrapghaiMonitorOutputSchema,
	displayName: 'Get Monitor',
	description: 'Gets one monitor by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Returns one monitor with its status, schedule, failure count and full config.',
		idempotent: true,
	},
	props: {
		monitorId: scrapegraphaiAiProps.monitorId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.getMonitor({ auth, monitorId: propsValue.monitorId });
	},
});
