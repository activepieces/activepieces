import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxListGlobalIpHealthCheckTypesAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_global_ip_health_check_types',
	displayName: 'List Global IP Health Check Types',
	description: 'Lists the health check types available for Global IPs.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every health check type available for Global IPs and the parameters each one takes.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const healthCheckTypes = await telnyxApi.listGlobalIpHealthCheckTypes({
			auth: context.auth,
		});
		return { healthCheckTypes, count: healthCheckTypes.length };
	},
});
