import {
  createAction,
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
      description: 'The new title of the note (max 255 characters)',
      required: false,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The new content of the note in ENML format',
      required: false,
    }),
    tags: Property.LongText({
      displayName: 'Tags',
      description: 'Comma-separated tag names to apply to the note',
      required: false,
    }),
  },

  async run(context) {
    const { note, title, content, tags } = context.propsValue;

    try {
      const { Client } = require('evernote');
      const client = new Client({ token: context.auth, sandbox: false });
      const noteStore = client.getNoteStore();
      
      const noteGuid = note as string;
      const existingNote = await noteStore.getNote(noteGuid, true, false, false, false);
      
      if (title) existingNote.title = title;
      if (content) existingNote.content = content;
      
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        if (tagArray.length > 0) {
          existingNote.tagNames = tagArray;
        }
      }

      const updatedNote = await noteStore.updateNote(existingNote);
      return updatedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      throw new Error(`Failed to update note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
