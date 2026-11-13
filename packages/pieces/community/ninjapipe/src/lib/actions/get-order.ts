import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const getOrder = createAction({
  auth: ninjapipeAuth,
  name: 'get_order',
  classification: 'READ',
  displayName: 'Get Order',
  description: 'Gets one order by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single NinjaPipe order by ID. Read-only.', idempotent: true },
  outputSchema: ninjapipeSchemas.order,
  props: {
    orderId: ninjapipeProps.orderRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.orderId, field: 'Order' });
    return ninjapipeClient.getRecord({ auth: ninjapipeClient.readAuth(context.auth), path: `/orders/${id}`, operation: 'get order' });
  },
});
