import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { orderStatusDropdown } from '../../common/props';

export const updateOrderStatusAction = createAction({
  name: 'update_order_status',
  displayName: 'Update Order Status',
  description:
    'Updates the status of an order (e.g., pending to paid, paid to fulfilled).',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The ID of the order',
      required: true,
    }),
    status: orderStatusDropdown,
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('orders/update-status', {
      orderId: context.propsValue.orderId,
      status: context.propsValue.status,
    });
  },
});
