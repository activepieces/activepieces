import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { requireApiName, requireId } from '../common/client';
import { moduleDropdown, recordDropdown } from '../common/props';
import { createNote } from '../common/records';
import { childWriteOutputSchema } from '../output-schemas';

export const addNoteAction = createAction({
  auth: zohoCrmAuth,
  name: 'add_note',
  classification: 'WRITE',
  displayName: 'Add Note',
  description: 'Adds a note to a record.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds a note (optional title plus content) to one Zoho CRM record in any module. Use to log a call summary or context on a lead, contact, deal or account. Not idempotent: each call adds another note.',
    idempotent: false,
  },
  props: {
    module: moduleDropdown(),
    record_id: recordDropdown(),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    content: Property.LongText({ displayName: 'Content', required: true }),
  },
  outputSchema: childWriteOutputSchema,
  async run({ auth, propsValue }) {
    return createNote({
      auth,
      module: requireApiName({ value: propsValue.module, name: 'Module' }),
      recordId: requireId({ value: propsValue.record_id, name: 'Record' }),
      title: propsValue.title,
      content: propsValue.content,
    });
  },
});
