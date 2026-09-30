import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps } from '../../common/props';
import { deleteOrderOutputSchema } from '../../output-schemas';

export const wooAiDeleteOrder = createAction({
  name: 'delete_order',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Order',
  description: 'Move an order to the trash, or delete it permanently.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes one order by id; to stop an order without removing it, set its status to cancelled with update_order instead. By default it goes to the trash, which a person can restore from the WordPress admin; with permanent it is deleted for good. Trashing an already-trashed order fails, so a retry is not safe.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: deleteOrderOutputSchema,
  props: {
    order_id: Property.Number({
      displayName: 'Order ID',
      description: 'Id of the order to delete. Find it with list_orders.',
      required: true,
    }),
    permanent: wooProps.permanentProp({ resource: 'order' }),
  },
  async run(context) {
    const { order_id, permanent } = context.propsValue;
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.DELETE,
      path: `/orders/${wooClient.encodeId(order_id)}`,
      queryParams: { force: permanent === true },
    });
  },
});
