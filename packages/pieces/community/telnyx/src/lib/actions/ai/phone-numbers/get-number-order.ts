import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetNumberOrderAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_number_order',
	displayName: 'Get Number Order',
	description: 'Gets a phone number purchase order.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one number order by id with its status, the numbers and whether regulatory requirements are met.',
		idempotent: true,
	},
	props: {
		numberOrderId: Property.ShortText({
			displayName: 'Number Order ID',
			description: 'Number order ID, returned by Create Number Order or List Number Orders.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getNumberOrder({
			auth: context.auth,
			numberOrderId: context.propsValue.numberOrderId,
		});
	},
});
