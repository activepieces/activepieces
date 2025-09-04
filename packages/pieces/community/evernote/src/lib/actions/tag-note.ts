import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

export const tagNote = createAction({
  auth: evernoteAuth,
  name: 'tag-note',
  displayName: 'Tag Note',
  description: 'Add or remove tags from an existing note in Evernote',
  props: {
    noteGuid: Property.ShortText({
      displayName: 'Note GUID',
      description: 'The GUID of the note to tag (required)',
      required: true,
    }),
    tagNames: Property.Array({
      displayName: 'Tag Names to Add',
      description: 'List of tag names to add to the note (optional)',
      required: false,
    }),
    tagGuids: Property.Array({
      displayName: 'Tag GUIDs to Add',
      description: 'List of tag GUIDs to add to the note (optional)',
      required: false,
    }),
    removeTagNames: Property.Array({
      displayName: 'Tag Names to Remove',
      description: 'List of tag names to remove from the note (optional)',
      required: false,
    }),
    removeTagGuids: Property.Array({
      displayName: 'Tag GUIDs to Remove',
      description: 'List of tag GUIDs to remove from the note (optional)',
      required: false,
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

    // Check if at least one tagging operation is specified
    const hasAddTags = (propsValue.tagNames && propsValue.tagNames.length > 0) || 
                      (propsValue.tagGuids && propsValue.tagGuids.length > 0);
    const hasRemoveTags = (propsValue.removeTagNames && propsValue.removeTagNames.length > 0) || 
                         (propsValue.removeTagGuids && propsValue.removeTagGuids.length > 0);
    
    if (!hasAddTags && !hasRemoveTags) {
      throw new Error('At least one tag operation (add or remove) must be specified');
    }

    try {
      // First, get the existing note to see current tags
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
          params: [propsValue.noteGuid, false, false, false, false],
        }),
      });

      if (getNoteResponse.status !== 200) {
        throw new Error(`Failed to retrieve existing note: ${getNoteResponse.status}`);
      }

      const existingNote = getNoteResponse.body;
      const currentTagNames = existingNote.tagNames || [];
      const currentTagGuids = existingNote.tagGuids || [];
      
      // Prepare updated tag lists
      let updatedTagNames = [...currentTagNames];
      let updatedTagGuids = [...currentTagGuids];
      
      // Add new tags
      if (propsValue.tagNames && propsValue.tagNames.length > 0) {
        for (const tagName of propsValue.tagNames) {
          if (!updatedTagNames.includes(tagName)) {
            updatedTagNames.push(tagName);
          }
        }
      }
      
      if (propsValue.tagGuids && propsValue.tagGuids.length > 0) {
        for (const tagGuid of propsValue.tagGuids) {
          if (!updatedTagGuids.includes(tagGuid)) {
            updatedTagGuids.push(tagGuid);
          }
        }
      }
      
      // Remove specified tags
      if (propsValue.removeTagNames && propsValue.removeTagNames.length > 0) {
        updatedTagNames = updatedTagNames.filter(tagName => 
          !propsValue.removeTagNames!.includes(tagName)
        );
      }
      
      if (propsValue.removeTagGuids && propsValue.removeTagGuids.length > 0) {
        updatedTagGuids = updatedTagGuids.filter(tagGuid => 
          !propsValue.removeTagGuids!.includes(tagGuid)
        );
      }

      // Prepare the updated note object
      const updatedNote = {
        guid: propsValue.noteGuid,
        tagNames: updatedTagNames,
        tagGuids: updatedTagGuids,
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
          message: 'Note tags updated successfully',
          tagChanges: {
            added: {
              names: propsValue.tagNames || [],
              guids: propsValue.tagGuids || [],
            },
            removed: {
              names: propsValue.removeTagNames || [],
              guids: propsValue.removeTagGuids || [],
            },
            current: {
              names: updatedTagNames,
              guids: updatedTagGuids,
            },
          },
        };
      } else {
        throw new Error(`Failed to update note tags: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Error updating note tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
