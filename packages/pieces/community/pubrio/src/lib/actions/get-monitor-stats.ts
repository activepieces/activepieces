import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getMonitorStats = createAction({
	auth: pubrioAuth,
	name: 'get_monitor_stats',
	displayName: 'Get Monitor Statistics',
	description: 'Get overall monitor statistics',
	props: {},
	async run(context) {
		return await pubrioRequest(context.auth as string, HttpMethod.POST, '/monitors/statistics');
	},
});
