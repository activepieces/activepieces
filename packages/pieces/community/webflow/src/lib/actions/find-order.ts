import { createAction } from '@activepieces/pieces-framework';

import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';
import { WebflowApiClient } from '../common/client';

export const webflowFindOrder = createAction({
	auth: webflowAuth,
	name: 'find_order',
	description: 'Find order',
	displayName: 'Find an order',
	audience: 'both',
	aiMetadata: { description: 'Retrieves a single Webflow Ecommerce order by its site ID and order ID. Use to look up order details before fulfilling, refunding, or unfulfilling it. Read-only and idempotent.', idempotent: true },
	props: {
		site_id: webflowProps.site_id,
		order_id: webflowProps.order_id,
	},

	async run(context) {
		const orderId = context.propsValue.order_id;
		const siteId = context.propsValue.site_id;

		const client = new WebflowApiClient(context.auth.access_token);

		return await client.getOrder(siteId, orderId);
	},
});
