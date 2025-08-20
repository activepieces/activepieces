import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

export const updateNote = createAction({
  auth: evernoteAuth,
  name: 'update-note',
  displayName: 'Update Note',
  description: 'Update an existing note in Evernote with new content and metadata',
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
      description: 'Whether the note should be active (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { access_token } = auth as { access_token: string };
    
    // Prepare the note update object according to Evernote's API structure
    const noteUpdateData: any = {
      guid: propsValue.noteGuid,
      title: propsValue.title,
      updateSequenceNum: 0,
    };

    // Only include content if it's being modified
    if (propsValue.content) {
      noteUpdateData.content = propsValue.content;
      noteUpdateData.contentLength = propsValue.content.length;
      noteUpdateData.contentHash = Buffer.from(propsValue.content).toString('base64');
    }

    // Only include notebook GUID if it's being changed
    if (propsValue.notebookGuid) {
      noteUpdateData.notebookGuid = propsValue.notebookGuid;
    }

    // Only include tag names if they're being modified
    if (propsValue.tagNames && propsValue.tagNames.length > 0) {
      noteUpdateData.tagNames = propsValue.tagNames;
    }

    // Only include attributes if they're being modified
    if (propsValue.source || propsValue.sourceURL) {
      noteUpdateData.attributes = {};
      
      if (propsValue.source) {
        noteUpdateData.attributes.source = propsValue.source;
      }
      
      if (propsValue.sourceURL) {
        noteUpdateData.attributes.sourceURL = propsValue.sourceURL;
      }
    }

    // Only include active status if it's being modified
    if (propsValue.active !== undefined) {
      noteUpdateData.active = propsValue.active;
    }

    try {
      // Evernote uses a custom API structure for updating notes
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
          message: 'Note updated successfully',
          updatedFields: Object.keys(noteUpdateData).filter(key => key !== 'guid'),
        };
      } else {
        throw new Error(`Failed to update note: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Error updating note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
