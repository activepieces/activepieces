import { createAction } from '@activepieces/pieces-framework';

import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';
import { WebflowApiClient } from '../common/client';

export const webflowUnfulfillOrder = createAction({
	auth: webflowAuth,
	name: 'unfulfill_order',
	classification: 'WRITE',
	description: 'Marks a fulfilled order as unfulfilled again.',
	displayName: 'Unfulfill Order',
	audience: 'both',
	aiMetadata: { description: 'Reverts an existing Webflow Ecommerce order back to an unfulfilled state, identified by site ID and order ID. Use to undo a fulfillment marking. Idempotent: re-running on an already-unfulfilled order leaves it unfulfilled.', idempotent: true },
	propertyGroups: [
		{ key: 'target', display: 'section', label: 'Order to Unfulfill', icon: 'inbox', props: ['site_id', 'order_id'] },
	],
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
