import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

export const appendToNote = createAction({
  auth: evernoteAuth,
  name: 'append-to-note',
  displayName: 'Append to Note',
  description: 'Continuously append content to an existing note (perfect for daily standups, logs, or ongoing documentation)',
  props: {
    noteGuid: Property.ShortText({
      displayName: 'Note GUID',
      description: 'The GUID of the note to append content to (required)',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content to Append',
      description: 'The content to append to the note in ENML format (required)',
      required: true,
    }),
    addTimestamp: Property.Checkbox({
      displayName: 'Add Timestamp',
      description: 'Whether to automatically add a timestamp before the appended content (default: true)',
      required: false,
      defaultValue: true,
    }),
    separator: Property.ShortText({
      displayName: 'Separator',
      description: 'Text to use as separator between appended content (default: "---")',
      required: false,
      defaultValue: '---',
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'The source application that appended the content (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { access_token } = auth as { access_token: string };
    
    if (!propsValue.content || propsValue.content.trim() === '') {
      throw new Error('Content to append cannot be empty');
    }

    try {
      // First, get the current note to retrieve existing content
      const getNoteResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://www.evernote.com/shard/s1/notestore',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
          'User-Agent': 'ActivePieces-Evernote-Integration/1.0',
        },
        body: JSON.stringify({
          method: 'getNote',
          params: [propsValue.noteGuid, true, false, false, false],
        }),
      });

      if (getNoteResponse.status !== 200 || !getNoteResponse.body) {
        throw new Error('Failed to retrieve the note for appending content');
      }

      const currentNote = getNoteResponse.body;
      const currentContent = currentNote.content || '';
      
      // Prepare the content to append
      let contentToAppend = propsValue.content;
      
      // Add timestamp if requested
      if (propsValue.addTimestamp) {
        const timestamp = new Date().toISOString();
        const formattedTimestamp = new Date(timestamp).toLocaleString();
        contentToAppend = `<p><strong>${formattedTimestamp}</strong></p>${contentToAppend}`;
      }
      
      // Add separator if there's existing content
      if (currentContent && currentContent.trim() !== '') {
        contentToAppend = `<p>${propsValue.separator || '---'}</p>${contentToAppend}`;
      }
      
      // Combine existing content with new content
      const newContent = currentContent + contentToAppend;
      
      // Prepare the note update object
      const noteUpdateData: any = {
        guid: propsValue.noteGuid,
        content: newContent,
        contentLength: newContent.length,
        contentHash: Buffer.from(newContent).toString('base64'),
        updateSequenceNum: 0,
      };

      // Add source information if provided
      if (propsValue.source) {
        noteUpdateData.attributes = {
          ...(currentNote.attributes || {}),
          source: propsValue.source,
          lastAppended: new Date().toISOString(),
        };
      }

      // Update the note with appended content
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://www.evernote.com/shard/s1/notestore',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
          'User-Agent': 'ActivePieces-Evernote-Integration/1.0',
        },
        body: JSON.stringify({
          method: 'updateNote',
          params: [noteUpdateData],
        }),
      });

      if (response.status === 200) {
        return {
          success: true,
          note: response.body,
          message: 'Content appended successfully',
          appendedContent: propsValue.content,
          totalContentLength: newContent.length,
          timestampAdded: propsValue.addTimestamp,
          separator: propsValue.separator || '---',
          source: propsValue.source || 'ActivePieces',
        };
      } else {
        throw new Error(`Failed to append to note: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Error appending to note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
