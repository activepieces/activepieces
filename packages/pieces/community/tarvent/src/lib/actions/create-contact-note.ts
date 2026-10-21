import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventTransport } from '../common/transport';
import { tarventOutputSchemas } from '../output-schemas';

export const createContactNote = createAction({
  auth: tarventAuth,
  name: 'tarvent_create_contact_note',
  classification: 'WRITE',
  displayName: 'Add Note To Contact',
  description: 'Adds a note to a contact.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds a free-text note (up to 255 characters) to one Tarvent contact by contact ID. Use to log context or activity against a contact. Returns the contact ID and the note text; Tarvent does not return the new note ID (use List Contact Notes). Not idempotent: each call adds another note.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.contactNoteCreated,
  props: {
    contactId: tarventCommon.contactId,
    note: Property.LongText({
      displayName: 'Note',
      description: 'The note to add to the contact (255 character limit).',
      required: true,
    }),
  },
  async run(context) {
    const contactId = tarventCommon.requireText({ value: context.propsValue.contactId, label: 'Contact ID' });
    const message = tarventCommon.requireText({ value: context.propsValue.note, label: 'Note' });
    tarventCommon.checkLength({ value: message, label: 'Note', max: 255 });
    await tarventTransport.field<{ id: string }>({
      auth: context.auth.props,
      query: 'mutation CreateContactNote($input: CreateContactNoteInput!) { createContactNote(input: $input) { id } }',
      variables: { input: { contactId, message } },
      name: 'createContactNote',
    });
    return { success: true, contactId, message };
  },
});
