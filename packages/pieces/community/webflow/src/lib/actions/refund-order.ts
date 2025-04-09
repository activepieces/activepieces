import { Property, createAction } from '@activepieces/pieces-framework'

import { webflowAuth } from '../..'
import { WebflowApiClient } from '../common/client'
import { webflowProps } from '../common/props'

export const webflowRefundOrder = createAction({
  auth: webflowAuth,
  name: 'refund_order',
  description: 'Refund order',
  displayName: 'Refund an order',
  props: {
    site_id: webflowProps.site_id,
    order_id: webflowProps.order_id,
    // reason: Property.StaticDropdown({
    // 	displayName: 'Reason',
    // 	description: 'The reason for the refund',
    // 	required: false,
    // 	options: {
    // 		disabled: false,
    // 		options: [
    // 			{
    // 				label: 'Duplicate',
    // 				value: 'duplicate',
    // 			},
    // 			{
    // 				label: 'Fraudulent',
    // 				value: 'fraudulent',
    // 			},
    // 			{
    // 				label: 'Requested',
    // 				value: 'requested',
    // 			},
    // 		],
    // 	},
    // }),
  },

  async run(context) {
    const orderId = context.propsValue.order_id
    const siteId = context.propsValue.site_id

    const client = new WebflowApiClient(context.auth.access_token)

    return await client.refundOrder(siteId, orderId)
  },
})
