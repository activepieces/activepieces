import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOrders } from '../common/orders';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';

export const addOrderNoteAction = createAction({
  auth: sallaAuth,
  name: 'add_order_note',
  classification: 'WRITE',
  displayName: 'Add Order Note',
  description: 'Adds a note to the order history without changing its status.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds a text note to the history of one Salla order, identified by its internal order ID (2116149737), without changing the status. To change the status and leave a note in one step, use Update Order Status instead. Each call adds a new note, so a retry writes a duplicate.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.orderHistory,
  props: {
    order: sallaProps.order({ required: true }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Text to add to the order history, for example "Customer asked to deliver after 5 PM."',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaOrders.addOrderNote({ auth, orderId: propsValue.order, note: propsValue.note });
  },
});
