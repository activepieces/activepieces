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
  audience: 'both',
  aiMetadata: {
    description:
      'Close an existing Coupa purchase order by ID, marking it complete so no further receiving or invoicing occurs — use Cancel Purchase Order to void an order instead. Not idempotent: closing is a one-way workflow transition and re-running on an already-closed order may fail.',
    idempotent: false,
  },
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
