import { Property, createAction } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient, wealthboxCommon } from '../common';

export const createNoteAction = createAction({
  auth: wealthboxCrmAuth,
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Creates a new note linked to a contact',
  props: {
    contact_id: wealthboxCommon.contactId,
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Note Body',
      required: true,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
      items: Property.ShortText({
        displayName: 'Tag',
        required: true,
      }),
    }),
  },
  async run(context) {
    const { contact_id, subject, body, tags } = context.propsValue;
    
    const client = makeClient(context.auth);
    
    const noteData: any = {
      resource_type: 'Contact',
      resource_id: contact_id,
      subject,
      body: {
        text: body,
        html: body,
      },
    };

    if (tags && tags.length > 0) {
      noteData.tags = tags;
    }

    const result = await client.createNote(noteData);
    
    return result;
  },
});
