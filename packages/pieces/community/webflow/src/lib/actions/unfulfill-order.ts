import { createAction } from '@activepieces/pieces-framework';

import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';
import { WebflowApiClient } from '../common/client';

export const webflowUnfulfillOrder = createAction({
	auth: webflowAuth,
	name: 'unfulfill_order',
	description: 'Unfulfill order',
	displayName: 'Unfulfill an order',
	props: {
		site_id: webflowProps.site_id,
		order_id: webflowProps.order_id,
	},

	async run(context) {
		const orderId = context.propsValue.order_id;
		const siteId = context.propsValue.site_id;

		const client = new WebflowApiClient(context.auth.access_token);

		return await client.unfulfillOrder(siteId, orderId);
	},
});
