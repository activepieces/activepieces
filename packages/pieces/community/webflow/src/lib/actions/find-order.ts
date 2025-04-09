import { createAction } from '@activepieces/pieces-framework'

import { webflowAuth } from '../..'
import { WebflowApiClient } from '../common/client'
import { webflowProps } from '../common/props'

export const webflowFindOrder = createAction({
  auth: webflowAuth,
  name: 'find_order',
  description: 'Find order',
  displayName: 'Find an order',
  props: {
    site_id: webflowProps.site_id,
    order_id: webflowProps.order_id,
  },

  async run(context) {
    const orderId = context.propsValue.order_id
    const siteId = context.propsValue.site_id

    const client = new WebflowApiClient(context.auth.access_token)

    return await client.getOrder(siteId, orderId)
  },
})
