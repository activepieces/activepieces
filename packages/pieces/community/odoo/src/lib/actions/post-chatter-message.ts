import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { OdooClient } from '../common/client';
import { odooOperations } from '../common/operations';
import { odooProps } from '../common/props';
import { odooInput } from '../common/values';
import { postMessageOutputSchema } from '../output-schemas';

export const postChatterMessageAction = createAction({
  auth: odooAuth,
  name: 'post_chatter_message',
  classification: 'WRITE',
  displayName: 'Post Chatter Message',
  description: 'Log a note or send a message in the chatter of a record.',
  audience: 'both',
  aiMetadata: {
    description:
      'Posts in the chatter of one Odoo record: an internal note (no email) or a message sent to followers. Works on models with a chatter (contacts, leads, orders, invoices, tasks). Not idempotent: each call posts another message.',
    idempotent: false,
  },
  outputSchema: postMessageOutputSchema,
  props: {
    model: odooProps.modelDropdown(),
    record_id: odooProps.recordDropdown(),
    body: Property.LongText({
      displayName: 'Message',
      description: 'Plain text. Odoo shows HTML tags as text when the message comes from the API.',
      required: true,
    }),
    kind: Property.StaticDropdown({
      displayName: 'Post As',
      description: 'An internal note is only visible to employees. A message is emailed to the followers of the record.',
      required: true,
      defaultValue: 'note',
      options: {
        options: [
          { label: 'Internal note', value: 'note' },
          { label: 'Message to followers', value: 'message' },
        ],
      },
    }),
  },
  async run(context) {
    const model = odooInput.toModelName(context.propsValue.model);
    const recordId = odooInput.toId({ value: context.propsValue.record_id, label: 'Record' });
    const body = odooInput.optionalText(context.propsValue.body);
    if (!body) throw new Error('Message cannot be empty.');
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooOperations.postMessage({
      client,
      model,
      recordId,
      body,
      kind: context.propsValue.kind === 'message' ? 'message' : 'note',
      partnerIds: [],
    });
  },
});
