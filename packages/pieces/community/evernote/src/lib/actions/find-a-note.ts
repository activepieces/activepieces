import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

export const findANote = createAction({
  auth: evernoteAuth,
  name: 'find-a-note',
  displayName: 'Find a Note',
  description: 'Finds a note by title, optionally limited by notebook and tags',
  props: {
    noteGuid: Property.ShortText({
      displayName: 'Note GUID',
      description: 'The GUID of the note to retrieve (required)',
      required: true,
    }),
    withContent: Property.Checkbox({
      displayName: 'Include Content',
      description: 'Whether to include the note content in the response (default: true)',
      required: false,
      defaultValue: true,
    }),
    withResourcesData: Property.Checkbox({
      displayName: 'Include Resources Data',
      description: 'Whether to include resource data in the response (default: false)',
      required: false,
      defaultValue: false,
    }),
    withResourcesRecognition: Property.Checkbox({
      displayName: 'Include Resources Recognition',
      description: 'Whether to include resource recognition data (default: false)',
      required: false,
      defaultValue: false,
    }),
    withResourcesAlternateData: Property.Checkbox({
      displayName: 'Include Resources Alternate Data',
      description: 'Whether to include alternate resource data (default: false)',
      required: false,
      defaultValue: false,
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
      // Call Evernote's getNote API to retrieve the note
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: noteStoreUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `OAuth oauth_consumer_key="${apiKey}", oauth_token="${accessToken}"`,
          'User-Agent': 'ActivePieces-Evernote-Integration/1.0',
        },
        body: JSON.stringify({
          method: 'getNote',
          params: [
            propsValue.noteGuid,
            propsValue.withContent !== undefined ? propsValue.withContent : true,
            propsValue.withResourcesData !== undefined ? propsValue.withResourcesData : false,
            propsValue.withResourcesRecognition !== undefined ? propsValue.withResourcesRecognition : false,
            propsValue.withResourcesAlternateData !== undefined ? propsValue.withResourcesAlternateData : false,
          ],
        }),
      });

      if (response.status === 200) {
        const note = response.body;
        
        // Prepare a clean response with note information
        const noteInfo = {
          guid: note.guid,
          title: note.title,
          content: note.content || null,
          contentLength: note.contentLength || 0,
          created: note.created ? new Date(note.created * 1000).toISOString() : null,
          updated: note.updated ? new Date(note.updated * 1000).toISOString() : null,
          active: note.active !== false,
          notebookGuid: note.notebookGuid || null,
          tagNames: note.tagNames || [],
          tagGuids: note.tagGuids || [],
          resources: note.resources ? note.resources.length : 0,
          hasContent: !!note.content,
          hasResources: !!(note.resources && note.resources.length > 0),
          updateSequenceNum: note.updateSequenceNum || 0,
        };

        return {
          success: true,
          note: note,
          noteInfo: noteInfo,
          message: 'Note retrieved successfully',
          retrievedWith: {
            content: propsValue.withContent !== undefined ? propsValue.withContent : true,
            resourcesData: propsValue.withResourcesData !== undefined ? propsValue.withResourcesData : false,
            resourcesRecognition: propsValue.withResourcesRecognition !== undefined ? propsValue.withResourcesRecognition : false,
            resourcesAlternateData: propsValue.withResourcesAlternateData !== undefined ? propsValue.withResourcesAlternateData : false,
          },
        };
      } else {
        throw new Error(`Failed to retrieve note: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Error retrieving note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
