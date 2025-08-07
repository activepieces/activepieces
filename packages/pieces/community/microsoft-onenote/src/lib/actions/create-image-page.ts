import { microsoftOneNoteAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { MicrosoftOneNoteClient } from '../common';

export const createImagePageAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_create_image_page',
  displayName: 'Create Image Page',
  description: 'Creates a new page with an embedded image in a OneNote section.',
  props: {
    sectionId: Property.ShortText({
      displayName: 'Section ID',
      description: 'The ID of the section where the page will be created',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Page Title',
      description: 'The title of the page',
      required: true,
    }),
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'The public URL of the image to embed',
      required: true,
    }),
  },
  async run(context) {
    const { sectionId, title, imageUrl } = context.propsValue;
    
    const client = new MicrosoftOneNoteClient(context.auth.access_token);
    return await client.createImagePage(sectionId, title, imageUrl);
  },
}); 