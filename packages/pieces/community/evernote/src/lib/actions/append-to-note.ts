import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

export const appendToNote = createAction({
  auth: evernoteAuth,
  name: 'append-to-note',
  displayName: 'Append to Note',
  description: 'Append content to an existing note in Evernote',
  props: {
    noteGuid: Property.ShortText({
      displayName: 'Note GUID',
      description: 'The GUID of the note to append content to (required)',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content to Append',
      description: 'The content to append to the note in ENML format (HTML-like markup)',
      required: true,
    }),
    appendAtEnd: Property.Checkbox({
      displayName: 'Append at End',
      description: 'Whether to append content at the end of the note (default: true)',
      required: false,
      defaultValue: true,
    }),
    separator: Property.ShortText({
      displayName: 'Separator',
      description: 'Text to insert between existing content and new content (optional)',
      required: false,
      defaultValue: '<br/>',
    }),
  },
  async run({ auth, propsValue }) {
    const { apiKey, accessToken, noteStoreUrl } = auth as { 
      apiKey: string; 
      accessToken: string; 
      noteStoreUrl: string; 
    };
    
    if (!propsValue.noteGuid || propsValue.noteGuid.trim() === '') {
      throw new Error('Note GUID cannot be empty');
    }

    if (!propsValue.content || propsValue.content.trim() === '') {
      throw new Error('Content to append cannot be empty');
    }

    try {
      // First, get the existing note to retrieve current content
      const getNoteResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: noteStoreUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `OAuth oauth_consumer_key="${apiKey}", oauth_token="${accessToken}"`,
          'User-Agent': 'ActivePieces-Evernote-Integration/1.0',
        },
        body: JSON.stringify({
          method: 'getNote',
          params: [propsValue.noteGuid, true, false, false, false],
        }),
      });

      if (getNoteResponse.status !== 200) {
        throw new Error(`Failed to retrieve existing note: ${getNoteResponse.status}`);
      }

      const existingNote = getNoteResponse.body;
      const currentContent = existingNote.content || '';
      
      // Prepare the new content
      let newContent: string;
      const separator = propsValue.separator || '<br/>';
      
      if (propsValue.appendAtEnd !== false) {
        // Append at the end
        if (currentContent && currentContent.trim() !== '') {
          newContent = currentContent + separator + propsValue.content;
        } else {
          newContent = propsValue.content;
        }
      } else {
        // Append at the beginning
        if (currentContent && currentContent.trim() !== '') {
          newContent = propsValue.content + separator + currentContent;
        } else {
          newContent = propsValue.content;
        }
      }

      // Prepare the updated note object
      const updatedNote = {
        guid: propsValue.noteGuid,
        content: newContent,
        contentLength: newContent.length,
        contentHash: Buffer.from(newContent).toString('base64'),
        updated: Math.floor(Date.now() / 1000),
        updateSequenceNum: existingNote.updateSequenceNum + 1,
      };

      // Call Evernote's updateNote API
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: noteStoreUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `OAuth oauth_consumer_key="${apiKey}", oauth_token="${accessToken}"`,
          'User-Agent': 'ActivePieces-Evernote-Integration/1.0',
        },
        body: JSON.stringify({
          method: 'updateNote',
          params: [updatedNote],
        }),
      });

      if (response.status === 200) {
        return {
          success: true,
          note: response.body,
          message: 'Content appended to note successfully',
          appendDetails: {
            originalContentLength: currentContent.length,
            newContentLength: newContent.length,
            appendedContent: propsValue.content,
            appendedAt: propsValue.appendAtEnd !== false ? 'end' : 'beginning',
            separator: separator,
          },
        };
      } else {
        throw new Error(`Failed to append content to note: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Error appending content to note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
