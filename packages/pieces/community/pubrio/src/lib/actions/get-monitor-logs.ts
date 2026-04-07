import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getMonitorLogs = createAction({
	auth: pubrioAuth,
	name: 'get_monitor_logs',
	displayName: 'Get Monitor Logs',
	description: 'Get logs for a specific monitor',
	props: {
		monitor_id: Property.ShortText({ displayName: 'Monitor ID', required: true }),
		page: Property.Number({ displayName: 'Page', required: false, defaultValue: 1 }),
		per_page: Property.Number({ displayName: 'Per Page', required: false, defaultValue: 25 }),
	},
	async run(context) {
		const body: Record<string, unknown> = {
			monitor_id: context.propsValue.monitor_id,
			page: context.propsValue.page ?? 1,
			per_page: context.propsValue.per_page ?? 25,
		};
		return await pubrioRequest(context.auth, HttpMethod.POST, '/monitors/statistics/logs', body);
	},
});
