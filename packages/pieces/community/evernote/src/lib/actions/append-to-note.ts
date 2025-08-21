import {
  createAction,
  OAuth2PropertyValue,
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
      const noteGuid = note as string;
      
      const response = await fetch(`https://www.evernote.com/edam/note/${noteGuid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${(context.auth as OAuth2PropertyValue).access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to append to note: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const updatedNote = await response.json();
      return updatedNote;
    } catch (error) {
      console.error('Error appending to note:', error);
      throw new Error(`Failed to append to note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
