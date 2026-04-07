import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getMonitorLogDetail = createAction({
	auth: pubrioAuth,
	name: 'get_monitor_log_detail',
	displayName: 'Get Monitor Log Detail',
	description: 'Get detailed information for a specific monitor log entry',
	props: {
		monitor_log_id: Property.ShortText({ displayName: 'Monitor Log ID', required: true }),
	},
	async run(context) {
		const body: Record<string, unknown> = {
			monitor_log_id: context.propsValue.monitor_log_id,
		};
		return await pubrioRequest(context.auth, HttpMethod.POST, '/monitors/statistics/logs/lookup', body);
	},
});
