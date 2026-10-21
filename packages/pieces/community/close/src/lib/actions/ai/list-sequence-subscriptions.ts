import { createAction, Property } from '@activepieces/pieces-framework';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';
import { sequenceSubscriptionShape } from './subscribe-contact-to-sequence';

export const listSequenceSubscriptions = createAction({
  auth: closeAuth,
  name: 'list_sequence_subscriptions',
  classification: 'SEARCH',
  displayName: 'List Sequence Subscriptions',
  description: 'List sequence subscriptions for a sequence, contact or lead.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Close sequence subscriptions filtered by at least one of sequence id (seq_...), contact id (cont_...) or lead id (lead_...). Returns subscription id (sub_...), sequence, contact, lead, sender and status (active, paused, finished, ...). Use the id with Pause Sequence Subscription. Paged with limit (1-100) and skip (use nextSkip). Read-only.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.offsetPage({ itemsLabel: 'Subscriptions', labelKey: 'id', items: sequenceSubscriptionShape.fields }),
  props: {
    sequenceId: Property.ShortText({ displayName: 'Sequence ID', required: false }),
    contactId: Property.ShortText({ displayName: 'Contact ID', required: false }),
    leadId: Property.ShortText({ displayName: 'Lead ID', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1-100, default 100', required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'Use nextSkip from the previous call.', required: false }),
  },
  async run({ auth, propsValue }) {
    const query = {
      sequence_id: closeClient.optionalCloseId({ value: propsValue.sequenceId, label: 'Sequence ID', prefix: 'seq' }),
      contact_id: closeClient.optionalCloseId({ value: propsValue.contactId, label: 'Contact ID', prefix: 'cont' }),
      lead_id: closeClient.optionalCloseId({ value: propsValue.leadId, label: 'Lead ID', prefix: 'lead' }),
    };
    if (!query.sequence_id && !query.contact_id && !query.lead_id) throw new Error('Provide at least one of Sequence ID, Contact ID or Lead ID.');
    const limit = closeClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 });
    const skip = closeClient.parseInteger({ value: propsValue.skip, label: 'Skip', min: 0, max: 1_000_000 });
    const page = await closeClient.listPage({ auth, path: '/sequence_subscription/', query, limit, skip });
    return closeMappers.offsetPage({ ...page, map: sequenceSubscriptionShape.map });
  },
});
