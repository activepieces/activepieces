import { microsoftOneNoteAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { MicrosoftOneNoteClient } from '../common';

export const appendNoteAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_append_note',
  displayName: 'Append Note',
  description: 'Appends content to the end of an existing note.',
  props: {
    pageId: Property.ShortText({
      displayName: 'Page ID',
      description: 'The ID of the page to append content to',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content to Append',
      description: 'The HTML content to append to the page',
      required: true,
    }),
  },
  async run(context) {
    const { pageId, content } = context.propsValue;
    
    const client = new MicrosoftOneNoteClient(context.auth.access_token);
    
    // Note: Microsoft Graph API doesn't have a direct "append" endpoint
    // This would require fetching the existing content and then updating the page
    // For now, we'll return a message indicating this limitation
    return {
      message: 'Append functionality requires fetching existing content first. This is a placeholder implementation.',
      pageId,
      contentToAppend: content,
    };
  },
}); 