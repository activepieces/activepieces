import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetNetworkAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_network',
	displayName: 'Get Network',
	description: 'Gets a private network.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one private network by id. For its interfaces use List Network Interfaces.',
		idempotent: true,
	},
	props: {
		networkId: Property.ShortText({
			displayName: 'Network ID',
			description: 'Network UUID. Use List Networks to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getNetwork({
			auth: context.auth,
			networkId: context.propsValue.networkId,
		});
	},
});
