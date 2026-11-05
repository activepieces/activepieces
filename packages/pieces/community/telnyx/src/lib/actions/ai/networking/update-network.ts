import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxUpdateNetworkAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_network',
	displayName: 'Update Network',
	description: 'Renames a private network.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Renames a private network, the only field the API lets you change. Use the id from List Networks or Create Network. Repeating the call with the same name leaves it unchanged.',
		idempotent: true,
	},
	props: {
		networkId: Property.ShortText({
			displayName: 'Network ID',
			description: 'Network UUID. Use List Networks to find it.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New name of the network.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.updateNetwork({
			auth: context.auth,
			networkId: p.networkId,
			body: { name: p.name },
		});
	},
});
