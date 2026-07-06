import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { coupaAuth } from '../auth';
import { CoupaClient } from '../common/client';
import { purchaseOrderDropdown } from '../common/props';
import { formatCoupaOutput } from '../common/utils';

export const cancelPurchaseOrder = createAction({
  auth: coupaAuth,
  name: 'cancel_purchase_order',
  displayName: 'Cancel Purchase Order',
  description:
    'Cancels a purchase order using `PUT /api/purchase_orders/:id/cancel`.',
  audience: 'both',
  aiMetadata: {
    description:
      'Cancel an existing Coupa purchase order by ID, voiding it rather than completing it — use Close Purchase Order to finalize a fulfilled order instead. This is an irreversible workflow transition and not idempotent: re-running against an already-cancelled order may fail.',
    idempotent: false,
  },
  props: {
    purchaseOrderId: purchaseOrderDropdown,
  },
  async run({ auth, propsValue }) {
    const client = new CoupaClient(auth.props);
    const result = await client.request<Record<string, unknown>>({
      method: HttpMethod.PUT,
      resourceUri: `/purchase_orders/${propsValue.purchaseOrderId}/cancel`,
    });
    return formatCoupaOutput(result, 'purchase_orders');
  },
});
