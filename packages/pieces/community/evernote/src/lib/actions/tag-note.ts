import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

export const tagNote = createAction({
  auth: evernoteAuth,
  name: 'tag-note',
  displayName: 'Tag Note',
  description: 'Automatically add tags to an existing note for organization and categorization',
  props: {
    noteGuid: Property.ShortText({
      displayName: 'Note GUID',
      description: 'The GUID of the note to tag (required)',
      required: true,
    }),
    tagNames: Property.Array({
      displayName: 'Tag Names',
      description: 'List of tag names to add to the note (required)',
      required: true,
    }),
    replaceExistingTags: Property.Checkbox({
      displayName: 'Replace Existing Tags',
      description: 'Whether to replace all existing tags or add to them (default: false)',
      required: false,
      defaultValue: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'The source application that added the tags (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { access_token } = auth as { access_token: string };
    
    if (!propsValue.tagNames || propsValue.tagNames.length === 0) {
      throw new Error('At least one tag name must be provided');
    }

    try {
      // First, get the current note to retrieve existing tags if we need to preserve them
      let currentTags: string[] = [];
      
      if (!propsValue.replaceExistingTags) {
        try {
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

                     if (getNoteResponse.status === 200 && getNoteResponse.body) {
             // Extract existing tag names from the note
             if (getNoteResponse.body.tagNames && Array.isArray(getNoteResponse.body.tagNames)) {
               currentTags = getNoteResponse.body.tagNames as string[];
             }
           }
        } catch (error) {
          // If we can't get the current note, we'll proceed with just the new tags
          console.warn('Could not retrieve current note tags, proceeding with new tags only');
        }
      }

      // Prepare the tag names array
      let finalTagNames: string[];
      
      if (propsValue.replaceExistingTags) {
        // Replace all existing tags with new ones
        finalTagNames = propsValue.tagNames as string[];
      } else {
        // Combine existing tags with new tags, removing duplicates
        const allTags = [...currentTags, ...(propsValue.tagNames as string[])];
        finalTagNames = [...new Set(allTags)]; // Remove duplicates
      }

      // Prepare the note update object for tagging
      const noteUpdateData: any = {
        guid: propsValue.noteGuid,
        tagNames: finalTagNames,
        updateSequenceNum: 0,
      };

      // Add source information if provided
      if (propsValue.source) {
        noteUpdateData.attributes = {
          source: propsValue.source,
        };
      }

      // Update the note with new tags
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
          message: 'Note tagged successfully',
          addedTags: propsValue.tagNames,
          totalTags: finalTagNames,
          replacedExisting: propsValue.replaceExistingTags,
          source: propsValue.source || 'ActivePieces',
        };
      } else {
        throw new Error(`Failed to tag note: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Error tagging note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
