import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowClient } from '../common/client';
import { webflowProps } from '../common/props';
import { orderOutputSchema } from '../output-schemas';

export const findOrderAction = createAction({
	auth: webflowAuth,
	outputSchema: orderOutputSchema,
	name: 'find_order',
	classification: 'READ',
	description: 'Find order',
	displayName: 'Find an order',
	audience: 'both',
	aiMetadata: { description: 'Retrieves a single Webflow Ecommerce order by its site ID and order ID. Use to look up order details before fulfilling, refunding, or unfulfilling it. Read-only and idempotent.', idempotent: true },
	props: {
		site_id: webflowProps.siteId({ required: true }),
		order_id: webflowProps.orderId({ required: true }),
	},

	async run(context) {
		const orderId = context.propsValue.order_id;
		const siteId = context.propsValue.site_id;

		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(siteId)}/orders/${encodeURIComponent(orderId)}`,
		});
	},
});
