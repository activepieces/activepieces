import { microsoftOneNoteAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { MicrosoftOneNoteClient } from '../common';

export const createPageAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_create_page',
  displayName: 'Create Page',
  description: 'Creates a new page in a OneNote section.',
  props: {
    sectionId: Property.ShortText({
      displayName: 'Section ID',
      description: 'The ID of the section where the page will be created',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Page Title',
      description: 'The title of the page (optional)',
      required: false,
    }),
    content: Property.LongText({
      displayName: 'Page Content',
      description: 'The HTML content of the page',
      required: true,
    }),
  },
  async run(context) {
    const { sectionId, title, content } = context.propsValue;
    
    const client = new MicrosoftOneNoteClient(context.auth.access_token);
    return await client.createPage(sectionId, { title, content });
  },
}); 