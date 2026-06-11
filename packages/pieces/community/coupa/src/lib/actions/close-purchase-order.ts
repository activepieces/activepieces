import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { coupaAuth } from '../auth';
import { CoupaClient } from '../common/client';
import { purchaseOrderDropdown } from '../common/props';
import { formatCoupaOutput } from '../common/utils';

export const closePurchaseOrder = createAction({
  auth: coupaAuth,
  name: 'close_purchase_order',
  displayName: 'Close Purchase Order',
  description:
    'Closes a purchase order using `PUT /api/purchase_orders/:id/close`.',
  props: {
    purchaseOrderId: purchaseOrderDropdown,
  },
  async run({ auth, propsValue }) {
    const client = new CoupaClient(auth.props);
    const result = await client.request<Record<string, unknown>>({
      method: HttpMethod.PUT,
      resourceUri: `/purchase_orders/${propsValue.purchaseOrderId}/close`,
    });
    return formatCoupaOutput(result, 'purchase_orders');
  },
});
