import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowClient } from '../common/client';
import { webflowProps } from '../common/props';
import { orderOutputSchema } from '../output-schemas';

export const unfulfillOrderAction = createAction({
	auth: webflowAuth,
	outputSchema: orderOutputSchema,
	name: 'unfulfill_order',
	classification: 'WRITE',
	description: 'Unfulfill order',
	displayName: 'Unfulfill an order',
	audience: 'both',
	aiMetadata: { description: 'Reverts an existing Webflow Ecommerce order back to an unfulfilled state, identified by site ID and order ID. Use to undo a fulfillment marking. Idempotent: re-running on an already-unfulfilled order leaves it unfulfilled.', idempotent: true },
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
			path: `/v2/sites/${encodeURIComponent(siteId)}/orders/${encodeURIComponent(orderId)}/unfulfill`,
		});
	},
});
