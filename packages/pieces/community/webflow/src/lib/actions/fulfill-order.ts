import { createAction, Property } from '@activepieces/pieces-framework';

import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';
import { WebflowApiClient } from '../common/client';

export const webflowFulfillOrder = createAction({
	auth: webflowAuth,
	name: 'fulfill_order',
	description: 'Fulfill order',
	displayName: 'Fulfill an order',
	props: {
		site_id: webflowProps.site_id,
		order_id: webflowProps.order_id,
		send_order_fulfilled_email: Property.Checkbox({
			displayName: 'Send Order Fulfilled Email',
			description: 'Send an email to the customer that their order has been fulfilled',
			required: false,
		}),
	},

	async run(context) {
		const orderId = context.propsValue.order_id;
		const siteId = context.propsValue.site_id;
		const sendOrderFulfilledEmail = context.propsValue.send_order_fulfilled_email;

		const client = new WebflowApiClient(context.auth.access_token);

		return await client.fulfillOrder(siteId, orderId, { sendOrderFulfilledEmail });
	},
});
