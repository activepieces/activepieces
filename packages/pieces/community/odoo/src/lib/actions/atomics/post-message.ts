import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooOperations } from '../../common/operations';
import { odooInput } from '../../common/values';
import { postMessageOutputSchema } from '../../output-schemas';
import { atomicProps } from './common';

export const odooPostMessage = createAction({
  auth: odooAuth,
  name: 'odoo_post_message',
  classification: 'WRITE',
  displayName: 'Post Message on Record',
  description: 'Post an internal note or a message in the chatter of an Odoo record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts in the chatter of one Odoo record (message_post): an internal note (default, no email) or a message emailed to the followers and to extra partners. Works on models with a chatter such as res.partner, crm.lead, sale.order, account.move, project.task. Not idempotent: each call posts another message.',
    idempotent: false,
  },
  outputSchema: postMessageOutputSchema,
  props: {
    model: atomicProps.modelProp(),
    record_id: atomicProps.idProp({ displayName: 'Record ID', description: 'ID of the record to post on.' }),
    body: Property.LongText({ displayName: 'Body', description: 'Plain text of the message. HTML tags are shown as text.', required: true }),
    kind: Property.StaticDropdown({
      displayName: 'Kind',
      description: 'note = internal note (default). message = sent to followers by email.',
      required: false,
      options: { options: [{ label: 'Internal note', value: 'note' }, { label: 'Message to followers', value: 'message' }] },
    }),
    partner_ids: Property.Array({
      displayName: 'Also Notify Partner IDs',
      description: 'Contact IDs (res.partner) to notify in addition to followers, for example [7]. Only used with kind "message".',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = odooInput.optionalText(p.body);
    if (!body) throw new Error('Body cannot be empty.');
    const kind = p.kind === 'message' ? 'message' : 'note';
    const partnerIds = odooInput.toIdList({ value: p.partner_ids, label: 'Partner IDs', allowEmpty: true });
    if (kind === 'note' && partnerIds.length > 0) throw new Error('Partner IDs are only used with kind "message".');
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooOperations.postMessage({
      client,
      model: odooInput.toModelName(p.model),
      recordId: odooInput.toId({ value: p.record_id, label: 'Record ID' }),
      body,
      kind,
      partnerIds,
    });
  },
});
