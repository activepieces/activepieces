import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { listOrderNotesOutputSchema } from '../../output-schemas';

export const wooAiListOrderNotes = createAction({
  name: 'list_order_notes',
  classification: 'SEARCH',
  displayName: 'List Order Notes',
  description: 'List the notes on an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists all notes on one order, both private staff notes and notes sent to the customer, including the ones WooCommerce writes itself for status changes and emails. Use it to read an order history or to find a note id for delete_order_note; add a note with add_order_note.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: listOrderNotesOutputSchema,
  props: {
    order_id: Property.Number({
      displayName: 'Order ID',
      description: 'Id of the order.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Note Type',
      description: 'Which notes to return. Defaults to all.',
      required: false,
      options: {
        options: [
          { label: 'All notes', value: 'any' },
          { label: 'Notes sent to the customer', value: 'customer' },
          { label: 'Private notes', value: 'internal' },
        ],
      },
    }),
  },
  async run(context) {
    const { order_id, type } = context.propsValue;
    return wooClient.request<unknown[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/orders/${wooClient.encodeId(order_id)}/notes`,
      queryParams: { type: type ?? 'any' },
    });
  },
});
