import { microsoftOneNoteAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { MicrosoftOneNoteClient } from '../common';

export const createImageNoteAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_create_image_note',
  displayName: 'Create Image Note',
  description: 'Create a note containing an embedded image via a public image URL.',
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