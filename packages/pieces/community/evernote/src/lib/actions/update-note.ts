import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

export const updateNote = createAction({
  auth: evernoteAuth,
  name: 'update-note',
  displayName: 'Update Note',
  description: 'Updates an existing note in Evernote',
  props: {
    noteGuid: Property.ShortText({
      displayName: 'Note GUID',
      description: 'The GUID of the note to update (required)',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The new title for the note (required)',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The new content for the note in ENML format (optional - leave empty to keep existing content)',
      required: false,
    }),
    notebookGuid: Property.ShortText({
      displayName: 'Notebook GUID',
      description: 'The GUID of the notebook to move the note to (optional)',
      required: false,
    }),
    tagNames: Property.Array({
      displayName: 'Tag Names',
      description: 'List of tag names to apply to the note (optional - leave empty to keep existing tags)',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'The source application that updated the note (optional)',
      required: false,
    }),
    sourceURL: Property.ShortText({
      displayName: 'Source URL',
      description: 'The URL where the note was originally found (optional)',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'Whether the note should be active (default: true)',
      required: false,
      defaultValue: true,
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

    try {
      // First, get the existing note to preserve unchanged fields
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
      
      // Prepare the updated note object
      const updatedNote: any = {
        guid: propsValue.noteGuid,
        title: propsValue.title,
        content: propsValue.content || existingNote.content,
        contentLength: propsValue.content ? propsValue.content.length : existingNote.contentLength,
        contentHash: propsValue.content ? Buffer.from(propsValue.content).toString('base64') : existingNote.contentHash,
        updated: Math.floor(Date.now() / 1000),
        active: propsValue.active !== undefined ? propsValue.active : existingNote.active,
        updateSequenceNum: existingNote.updateSequenceNum + 1,
      };

      // Only update fields that are provided
      if (propsValue.notebookGuid) {
        updatedNote.notebookGuid = propsValue.notebookGuid;
      } else {
        updatedNote.notebookGuid = existingNote.notebookGuid;
      }

      if (propsValue.tagNames && propsValue.tagNames.length > 0) {
        updatedNote.tagNames = propsValue.tagNames;
      } else {
        updatedNote.tagNames = existingNote.tagNames || [];
      }

      // Handle attributes
      if (propsValue.source || propsValue.sourceURL) {
        updatedNote.attributes = existingNote.attributes || {};
        
        if (propsValue.source) {
          updatedNote.attributes.source = propsValue.source;
        }
        
        if (propsValue.sourceURL) {
          updatedNote.attributes.sourceURL = propsValue.sourceURL;
        }
      } else {
        updatedNote.attributes = existingNote.attributes;
      }

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
          message: 'Note updated successfully',
          updatedFields: {
            title: propsValue.title,
            content: !!propsValue.content,
            notebookGuid: !!propsValue.notebookGuid,
            tagNames: !!propsValue.tagNames,
            source: !!propsValue.source,
            sourceURL: !!propsValue.sourceURL,
            active: propsValue.active !== undefined,
          },
        };
      } else {
        throw new Error(`Failed to update note: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Error updating note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
