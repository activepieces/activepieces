import { microsoftOneNoteAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { MicrosoftOneNoteClient } from '../common';

export const appendNoteAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_append_note',
  displayName: 'Append Note',
  description: 'Append content to the end of an existing note.',
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
    
    // Get the existing page content first
    const existingContent = await client.getPageContent(pageId);
    
    // Combine existing content with new content
    const updatedContent = existingContent + content;
    
    // Update the page with combined content
    return await client.updatePage(pageId, { content: updatedContent });
  },
}); 