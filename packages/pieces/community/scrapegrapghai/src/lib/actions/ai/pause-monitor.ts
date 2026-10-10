import { createAction } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegrapghaiMonitorOutputSchema } from '../../output-schemas';

export const pauseMonitorAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_pause_monitor',
	outputSchema: scrapegrapghaiMonitorOutputSchema,
	displayName: 'Pause Monitor',
	description: 'Pauses a monitor so it stops running.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Pauses a monitor: future runs stop but the monitor and its history are kept. Undo with Resume Monitor.',
		idempotent: true,
	},
	props: {
		monitorId: scrapegraphaiAiProps.monitorId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.pauseMonitor({ auth, monitorId: propsValue.monitorId });
	},
});
