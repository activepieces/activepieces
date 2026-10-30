import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowClient } from '../common/client';
import { webflowProps } from '../common/props';

export const refundOrderAction = createAction({
	auth: webflowAuth,
	name: 'refund_order',
	classification: 'DESTRUCTIVE',
	description: 'Refund order',
	displayName: 'Refund an order',
	audience: 'both',
	aiMetadata: { description: 'Issues a refund for an existing Webflow Ecommerce order, identified by site ID and order ID. Use to reverse a customer payment. This moves money and is not idempotent — repeating it risks duplicate refund attempts, so call it once per order.', idempotent: false },
	props: {
		site_id: webflowProps.siteId({ required: true }),
		order_id: webflowProps.orderId({ required: true }),
	},

	async run(context) {
		const orderId = context.propsValue.order_id;
		const siteId = context.propsValue.site_id;

		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/sites/${siteId}/orders/${orderId}/refund`,
		});
	},
});
