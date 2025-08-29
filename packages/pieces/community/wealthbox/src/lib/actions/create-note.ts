import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const createNote = createAction({
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Creates a new note linked to a contact in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    content: Property.LongText({
      displayName: 'Note Content',
      description: 'The content of the note',
      required: true,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to link the note to',
      required: true,
    }),
  },
  async run(context) {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    
    const noteData = {
      content: context.propsValue.content,
      contact_id: context.propsValue.contact_id,
    };

    const note = await client.createNote(noteData);
    return note;
  },
}); 