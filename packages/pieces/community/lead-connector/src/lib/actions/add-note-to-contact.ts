import { createAction, Property } from '@activepieces/pieces-framework';
import { addNoteToContact } from '../common';
import { leadConnectorProps } from '../common/props';
import { leadConnectorAuth } from '../..';

export const addNoteToContactAction = createAction({
  auth: leadConnectorAuth,
  name: 'add_note_to_contact',
  classification: 'WRITE',
  displayName: 'Add Note to Contact',
  description: 'Add a new note to a contact.',
  audience: 'both',
  aiMetadata: { description: 'Appends a note (free-text body attributed to a user) to an existing GoHighLevel/LeadConnector contact. Requires the contact ID and the authoring user ID. Not idempotent — each call appends a new note even if the text is identical.', idempotent: false },
  props: {
    contact: leadConnectorProps.contact({ required: true }),
    note: Property.ShortText({
      displayName: 'Note',
      required: true,
      placeholder: 'Called and left a voicemail.',
    }),
    user: leadConnectorProps.user({
      displayName: 'Author',
      description: 'The team member the note is credited to.',
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const { contact, note, user } = propsValue;

    return await addNoteToContact(auth.access_token, contact, {
      body: note,
      userId: user,
    });
  },
});
