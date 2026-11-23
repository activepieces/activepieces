import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { tinkoAuth } from '../auth';
import { TinkoItemResponse, TinkoNote, tinkoClient } from '../common/client';
import { tinkoContact } from '../common/contact';
import { tinkoOutput } from '../common/output';

export const addNoteToContactAction = createAction({
  auth: tinkoAuth,
  name: 'add_note_to_contact',
  classification: 'WRITE',
  displayName: 'Add Note to Contact',
  description: 'Adds an internal note to a contact. Notes are visible only to your team.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add an internal note to an existing Tinko contact by ID, for example a summary of an order or a call. The contact never sees notes. Each call adds a new note, so retries duplicate it.',
    idempotent: false,
  },
  props: {
    contactId: tinkoContact.contactId(),
    content: Property.LongText({
      displayName: 'Note',
      description: 'Text of the note, up to 5000 characters.',
      required: true,
    }),
  },
  async run(context) {
    const id = context.propsValue.contactId.trim();
    const response = await tinkoClient.request<TinkoItemResponse<TinkoNote>>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `${tinkoClient.pathFor('contacts', id)}/notes`,
      body: { content: context.propsValue.content },
    });
    if (!response.data) {
      throw new Error('Tinko did not return the created note');
    }
    return { contact_id: id, ...tinkoOutput.note(response.data) };
  },
});
