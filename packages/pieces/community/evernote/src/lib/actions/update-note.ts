import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { evernoteAuth } from '../..';
import { evernoteCommon } from '../common';

export const updateNote = createAction({
  auth: evernoteAuth,
  name: 'updateNote',
  displayName: 'Update Note',
  description: 'Update an existing note in Evernote',
  props: {
    note: evernoteCommon.note,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The new title of the note',
      required: false,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The new content of the note (HTML format)',
      required: false,
    }),
    tags: Property.LongText({
      displayName: 'Tags',
      description: 'Comma-separated tags to apply to the note',
      required: false,
    }),
  },

  async run(context) {
    const { note, title, content, tags } = context.propsValue;

    try {
      const noteGuid = note as string;
      const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
      
      const response = await fetch(`https://www.evernote.com/edam/note/${noteGuid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${(context.auth as OAuth2PropertyValue).access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          content: content,
          tagGuids: tagArray,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update note: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const updatedNote = await response.json();
      return updatedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      throw new Error(`Failed to update note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
