import {
  createAction,
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
      description: 'The title of the note (max 255 characters)',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The content of the note in ENML format (HTML-like)',
      required: true,
    }),
    tags: Property.LongText({
      displayName: 'Tags',
      description: 'Comma-separated tag names to apply to the note',
      required: false,
    }),
  },

  async run(context) {
    const { notebook, title, content, tags } = context.propsValue;

    try {
      const { Client } = require('evernote');
      const client = new Client({ token: context.auth, sandbox: false });
      const noteStore = client.getNoteStore();
      
      const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
      
      const note = new noteStore.constructor.Note();
      note.title = title;
      note.content = content;
      note.notebookGuid = notebook as string;
      
      if (tagArray.length > 0) {
        note.tagNames = tagArray;
      }

      const createdNote = await noteStore.createNote(note);
      return createdNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw new Error(`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
