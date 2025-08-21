import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { evernoteAuth } from '../..';
import { evernoteCommon } from '../common';

export const appendToNote = createAction({
  auth: evernoteAuth,
  name: 'appendToNote',
  displayName: 'Append to Note',
  description: 'Append content to an existing note in Evernote',
  props: {
    note: evernoteCommon.note,
    content: Property.LongText({
      displayName: 'Content to Append',
      description: 'The content to append to the note (HTML format)',
      required: true,
    }),
  },

  async run(context) {
    const { note, content } = context.propsValue;

    try {
      const { Client } = require('evernote');
      const client = new Client({ token: context.auth, sandbox: false });
      const noteStore = client.getNoteStore();
      
      const noteGuid = note as string;
      const existingNote = await noteStore.getNote(noteGuid, true, false, false, false);
      
      const currentContent = existingNote.content || '';
      const newContent = currentContent + content;
      
      existingNote.content = newContent;

      const updatedNote = await noteStore.updateNote(existingNote);
      return updatedNote;
    } catch (error) {
      console.error('Error appending to note:', error);
      throw new Error(`Failed to append to note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
