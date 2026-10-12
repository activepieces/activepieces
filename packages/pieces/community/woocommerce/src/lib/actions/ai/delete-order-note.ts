import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { deleteOrderNoteOutputSchema } from '../../output-schemas';

export const wooAiDeleteOrderNote = createAction({
  name: 'delete_order_note',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Order Note',
  description: 'Permanently delete a note from an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one note from an order (find note ids with list_order_notes); order notes have no trash, so it cannot be restored. Deleting a note sent to the customer does not unsend the email. A second call for the same note fails.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: deleteOrderNoteOutputSchema,
  props: {
    order_id: Property.Number({
      displayName: 'Order ID',
      description: 'Id of the order the note belongs to.',
      required: true,
    }),
    note_id: Property.Number({
      displayName: 'Note ID',
      description: 'Id of the note to delete.',
      required: true,
    }),
  },
  async run(context) {
    const { order_id, note_id } = context.propsValue;
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.DELETE,
      path: `/orders/${wooClient.encodeId(order_id)}/notes/${wooClient.encodeId(note_id)}`,
      queryParams: { force: true },
    });
  },
});
