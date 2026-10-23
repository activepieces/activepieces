import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxCreateNetworkAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_create_network',
	displayName: 'Create Network',
	description: 'Creates a private network.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a Telnyx private network with the given name. Not idempotent: every call creates a new network.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the network.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.createNetwork({
			auth: context.auth,
			body: { name: context.propsValue.name },
		});
	},
});
