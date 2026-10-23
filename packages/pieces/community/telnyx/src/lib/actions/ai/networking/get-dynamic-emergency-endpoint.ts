import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetDynamicEmergencyEndpointAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_dynamic_emergency_endpoint',
	displayName: 'Get Dynamic Emergency Endpoint',
	description: 'Gets a dynamic E911 endpoint.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one dynamic emergency (E911) endpoint by id. Use List Dynamic Emergency Endpoints to find ids.',
		idempotent: true,
	},
	props: {
		endpointId: Property.ShortText({
			displayName: 'Endpoint ID',
			description:
				'Dynamic emergency endpoint UUID. Use List Dynamic Emergency Endpoints to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getDynamicEmergencyEndpoint({
			auth: context.auth,
			endpointId: context.propsValue.endpointId,
		});
	},
});
