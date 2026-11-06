import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const addContactNote = createAction({
  auth: ninjapipeAuth,
  name: 'add_contact_note',
  classification: 'WRITE',
  displayName: 'Add Note to Contact',
  description: "Adds a note to a contact's activity timeline.",
  audience: 'human',
  aiMetadata: { description: "Add a note to a NinjaPipe contact's activity timeline. Not idempotent: each call adds another note.", idempotent: false },
  outputSchema: ninjapipeSchemas.activity,
  props: {
    contactId: ninjapipeProps.contactRequired(),
    title: Property.ShortText({ displayName: 'Title', required: true }),
    content: Property.LongText({ displayName: 'Content', required: false }),
    date: Property.DateTime({ displayName: 'Date', description: 'When the note happened. Defaults to now.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.sendRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.POST,
      path: `/contacts/${ninjapipeClient.pathId({ value: p.contactId, field: 'Contact' })}/activities`,
      body: ninjapipeFields.compact({ type: 'note', title: p.title, content: p.content, date: p.date }),
      operation: 'add contact note',
    });
  },
});
