import { microsoftOneNoteAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { MicrosoftOneNoteClient } from '../common';

export const createNoteInSectionAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_create_note_in_section',
  displayName: 'Create Note in Section',
  description: 'Create a new note in a specific notebook and section with title and content.',
  props: {
    sectionId: Property.ShortText({
      displayName: 'Section ID',
      description: 'The ID of the section where the note will be created',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Note Title',
      description: 'The title of the note',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Note Content',
      description: 'The content of the note (HTML format)',
      required: true,
    }),
  },
  async run(context) {
    const { sectionId, title, content } = context.propsValue;
    
    const client = new MicrosoftOneNoteClient(context.auth.access_token);
    return await client.createPage(sectionId, { title, content });
  },
}); 