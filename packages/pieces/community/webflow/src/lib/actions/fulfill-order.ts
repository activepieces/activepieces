import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowClient } from '../common/client';
import { webflowProps } from '../common/props';

export const fulfillOrderAction = createAction({
	auth: webflowAuth,
	name: 'fulfill_order',
	classification: 'WRITE',
	description: 'Fulfill order',
	displayName: 'Fulfill an order',
	audience: 'both',
	aiMetadata: { description: 'Marks an existing Webflow Ecommerce order as fulfilled, identified by site ID and order ID, optionally sending the customer a fulfillment email. Use after shipping or completing an order. Setting fulfilled state is idempotent, but enabling the email may resend a notification, so prefer leaving it off when retrying.', idempotent: false },
	props: {
		site_id: webflowProps.siteId({ required: true }),
		order_id: webflowProps.orderId({ required: true }),
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

		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/sites/${siteId}/orders/${orderId}/fulfill`,
			body: { sendOrderFulfilledEmail },
		});
	},
});
