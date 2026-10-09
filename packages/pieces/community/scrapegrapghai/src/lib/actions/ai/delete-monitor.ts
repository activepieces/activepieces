import { createAction } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';

export const deleteMonitorAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_delete_monitor',
	displayName: 'Delete Monitor',
	description: 'Permanently deletes a monitor and its run history.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a monitor and all its run history; this cannot be undone. Use Pause Monitor to only stop it.',
		idempotent: false,
	},
	props: {
		monitorId: scrapegraphaiAiProps.monitorId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.deleteMonitor({ auth, monitorId: propsValue.monitorId });
	},
});
