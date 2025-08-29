import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

export const createNote = createAction({
  auth: evernoteAuth,
  name: 'create-note',
  displayName: 'Create Note',
  description: 'Create a new note in Evernote',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the note',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The content of the note in ENML format (HTML-like markup)',
      required: true,
    }),
    notebookGuid: Property.ShortText({
      displayName: 'Notebook GUID',
      description: 'The GUID of the notebook where the note should be created (optional)',
      required: false,
    }),
    tagNames: Property.Array({
      displayName: 'Tag Names',
      description: 'List of tag names to apply to the note (optional)',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'The source application that created the note (optional)',
      required: false,
    }),
    sourceURL: Property.ShortText({
      displayName: 'Source URL',
      description: 'The URL where the note was originally found (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { apiKey, accessToken, noteStoreUrl } = auth as { 
      apiKey: string; 
      accessToken: string; 
      noteStoreUrl: string; 
    };
    
    // Prepare the note object according to Evernote's API structure
    const noteData: any = {
      title: propsValue.title,
      content: propsValue.content,
      contentLength: propsValue.content.length,
      contentHash: Buffer.from(propsValue.content).toString('base64'),
      created: Math.floor(Date.now() / 1000),
      updated: Math.floor(Date.now() / 1000),
      active: true,
      updateSequenceNum: 0,
    };

    if (propsValue.notebookGuid) {
      noteData.notebookGuid = propsValue.notebookGuid;
    }

    if (propsValue.tagNames && propsValue.tagNames.length > 0) {
      noteData.tagNames = propsValue.tagNames;
    }

    if (propsValue.source || propsValue.sourceURL) {
      noteData.attributes = {};
      
      if (propsValue.source) {
        noteData.attributes.source = propsValue.source;
      }
      
      if (propsValue.sourceURL) {
        noteData.attributes.sourceURL = propsValue.sourceURL;
      }
    }

    try {
      // Use the user's personal note store URL
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: noteStoreUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `OAuth oauth_consumer_key="${apiKey}", oauth_token="${accessToken}"`,
          'User-Agent': 'ActivePieces-Evernote-Integration/1.0',
        },
        body: JSON.stringify({
          method: 'createNote',
          params: [noteData],
        }),
      });

      if (response.status === 200) {
        return {
          success: true,
          note: response.body,
          message: 'Note created successfully',
        };
      } else {
        throw new Error(`Failed to create note: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Error creating note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
