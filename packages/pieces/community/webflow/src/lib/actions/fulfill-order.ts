import { createAction, Property } from '@activepieces/pieces-framework';

import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';
import { WebflowApiClient } from '../common/client';

export const webflowFulfillOrder = createAction({
	auth: webflowAuth,
	name: 'fulfill_order',
	classification: 'WRITE',
	description: 'Marks an order as fulfilled, optionally emailing the customer.',
	displayName: 'Fulfill Order',
	audience: 'both',
	aiMetadata: { description: 'Marks an existing Webflow Ecommerce order as fulfilled, identified by site ID and order ID, optionally sending the customer a fulfillment email. Use after shipping or completing an order. Setting fulfilled state is idempotent, but enabling the email may resend a notification, so prefer leaving it off when retrying.', idempotent: false },
	propertyGroups: [
		{ key: 'target', display: 'section', label: 'Order to Fulfill', icon: 'inbox', props: ['site_id', 'order_id'] },
		{ key: 'notify', display: 'section', label: 'Notification', icon: 'send', props: ['send_order_fulfilled_email'] },
	],
	props: {
		site_id: webflowProps.site_id,
		order_id: webflowProps.order_id,
		send_order_fulfilled_email: Property.Checkbox({
			displayName: 'Email the Customer',
			description: "Sends the customer Webflow's order fulfilled email.",
			required: false,
			defaultValue: false,
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
