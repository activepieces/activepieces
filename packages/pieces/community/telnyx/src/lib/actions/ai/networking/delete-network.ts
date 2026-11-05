import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxDeleteNetworkAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_delete_network',
	displayName: 'Delete Network',
	description: 'Deletes a private network.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a private network. Returns the deleted network.',
		idempotent: false,
	},
	props: {
		networkId: Property.ShortText({
			displayName: 'Network ID',
			description: 'Network UUID. Use List Networks to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.deleteNetwork({
			auth: context.auth,
			networkId: context.propsValue.networkId,
		});
	},
});
