import { createAction } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventOutputSchemas } from '../output-schemas';

export const listContactNotes = createAction({
  auth: tarventAuth,
  name: 'tarvent_list_contact_notes',
  classification: 'READ',
  displayName: 'List Contact Notes',
  description: 'Lists the notes on a contact, newest first.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the notes on one Tarvent contact by contact ID, newest first, up to 50 per call. Returns items plus hasMore and nextCursor; pass nextCursor back as Cursor for the next page. Read-only.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.contactNotePage,
  props: {
    contactId: tarventCommon.contactId,
    limit: tarventCommon.limit,
    cursor: tarventCommon.cursor,
  },
  async run(context) {
    const contactId = tarventCommon.requireText({ value: context.propsValue.contactId, label: 'Contact ID' });
    return tarventClient.listPage({
      auth: context.auth.props,
      operation: 'ListContactNotes',
      field: 'contactNotes',
      selection: 'id message status createdBy createdUtc modifiedUtc',
      argDefs: ', $contactId: String!, $order: [ContactNoteSortInput!]',
      args: ', contactId: $contactId, order: $order',
      variables: { contactId, order: [{ createdUtc: 'DESC' }] },
      first: tarventCommon.pageLimit(context.propsValue.limit),
      after: tarventCommon.trimmed(context.propsValue.cursor),
    });
  },
});
