import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const retryMonitor = createAction({
	auth: pubrioAuth,
	name: 'retry_monitor',
	displayName: 'Retry Monitor',
	description: 'Retry a failed monitor log entry',
	props: {
		monitor_id: Property.ShortText({ displayName: 'Monitor ID', required: true }),
		monitor_log_id: Property.ShortText({ displayName: 'Monitor Log ID', required: true }),
		is_use_original_destination: Property.Checkbox({ displayName: 'Use Original Destination', required: false, defaultValue: false }),
	},
	async run(context) {
		const body: Record<string, unknown> = {
			monitor_id: context.propsValue.monitor_id,
			monitor_log_id: context.propsValue.monitor_log_id,
		};
		if (context.propsValue.is_use_original_destination) body.is_use_original_destination = context.propsValue.is_use_original_destination;
		return await pubrioRequest(context.auth, HttpMethod.POST, '/monitors/process/retry', body);
	},
});
