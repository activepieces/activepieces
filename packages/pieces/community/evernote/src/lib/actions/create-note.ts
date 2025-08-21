import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { evernoteAuth } from '../..';
import { evernoteCommon } from '../common';

export const createNote = createAction({
  auth: evernoteAuth,
  name: 'createNote',
  displayName: 'Create Note',
  description: 'Create a new note in Evernote',
  props: {
    notebook: evernoteCommon.notebook,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the note',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The content of the note (HTML format)',
      required: true,
    }),
    tags: Property.LongText({
      displayName: 'Tags',
      description: 'Comma-separated tags to apply to the note',
      required: false,
    }),
  },

  async run(context) {
    const { notebook, title, content, tags } = context.propsValue;

    try {
      const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
      
      const noteData = {
        title: title,
        content: content,
        notebookGuid: notebook as string,
        tagGuids: tagArray,
      };

      const response = await fetch('https://www.evernote.com/edam/note', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(context.auth as OAuth2PropertyValue).access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create note: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const createdNote = await response.json();
      return createdNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw new Error(`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
