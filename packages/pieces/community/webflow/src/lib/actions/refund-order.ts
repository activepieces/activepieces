import { createAction } from '@activepieces/pieces-framework';

import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';
import { WebflowApiClient } from '../common/client';

export const webflowRefundOrder = createAction({
	auth: webflowAuth,
	name: 'refund_order',
	classification: 'DESTRUCTIVE',
	description: "Refunds an order's payment to the customer.",
	displayName: 'Refund Order',
	audience: 'both',
	aiMetadata: { description: 'Issues a refund for an existing Webflow Ecommerce order, identified by site ID and order ID. Use to reverse a customer payment. This moves money and is not idempotent — repeating it risks duplicate refund attempts, so call it once per order.', idempotent: false },
	propertyGroups: [
		{ key: 'target', display: 'section', label: 'Order to Refund', icon: 'inbox', props: ['site_id', 'order_id'] },
	],
	props: {
		site_id: webflowProps.site_id,
		order_id: webflowProps.order_id,
	},

	async run(context) {
		const orderId = context.propsValue.order_id;
		const siteId = context.propsValue.site_id;

		const client = new WebflowApiClient(context.auth.access_token);

		return await client.refundOrder(siteId, orderId);
	},
});
