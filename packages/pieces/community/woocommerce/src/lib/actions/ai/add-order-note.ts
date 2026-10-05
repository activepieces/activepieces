import { createAction } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { addOrderNoteOutputSchema } from '../../output-schemas';
import { wooAddOrderNote } from '../add-order-note';

export const wooAiAddOrderNote = createAction({
  name: 'add_order_note',
  classification: 'WRITE',
  displayName: 'Add Order Note',
  description: 'Add a private or customer-facing note to an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a note to one order: a private note for staff, or, with customer note on, a note that is emailed to the customer straight away. Read existing notes with list_order_notes. Each call adds another note, so a retry duplicates it (and resends the email).',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: addOrderNoteOutputSchema,
  props: wooAddOrderNote.props,
  run: wooAddOrderNote.run,
});
