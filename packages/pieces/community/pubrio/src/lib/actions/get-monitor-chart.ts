import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getMonitorChart = createAction({
	auth: pubrioAuth,
	name: 'get_monitor_chart',
	displayName: 'Get Monitor Chart',
	description: 'Get chart data for a monitor over a date range',
	props: {
		monitor_id: Property.ShortText({ displayName: 'Monitor ID', required: true }),
		start_date: Property.ShortText({ displayName: 'Start Date', required: true, description: 'Start date (YYYY-MM-DD)' }),
		end_date: Property.ShortText({ displayName: 'End Date', required: true, description: 'End date (YYYY-MM-DD)' }),
	},
	async run(context) {
		const body: Record<string, unknown> = {
			monitor_id: context.propsValue.monitor_id,
			start_date: context.propsValue.start_date,
			end_date: context.propsValue.end_date,
		};
		return await pubrioRequest(context.auth, HttpMethod.POST, '/monitors/statistics/chart', body);
	},
});
