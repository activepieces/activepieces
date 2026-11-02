import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const deleteOrder = createAction({
  auth: ninjapipeAuth,
  name: 'delete_order',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Order',
  description: 'Permanently deletes a order.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently delete one NinjaPipe order by ID (orderId; get it from a list or search step). Cannot be undone. A second call fails with 404 because the order is gone.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.deleted,
  props: {
    orderId: ninjapipeProps.orderRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.orderId, field: 'Order' });
    return ninjapipeClient.deleteRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/orders/${id}`,
      id: decodeURIComponent(id),
      operation: 'delete order',
    });
  },
});
