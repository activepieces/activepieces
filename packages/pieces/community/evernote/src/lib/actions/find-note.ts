import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { evernoteAuth } from '../..';
import { evernoteCommon } from '../common';

export const findNote = createAction({
  auth: evernoteAuth,
  name: 'findNote',
  displayName: 'Find Note',
  description: 'Search for notes in Evernote',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The search query to find notes',
      required: true,
    }),
    notebook: evernoteCommon.notebook,
    tag: evernoteCommon.tag,
    maxResults: Property.Number({
      displayName: 'Maximum Results',
      description: 'Maximum number of results to return (default: 20)',
      required: false,
      defaultValue: 20,
    }),
  },

  async run(context) {
    const { query, notebook, tag, maxResults } = context.propsValue;

    try {
      const { Client } = require('evernote');
      const client = new Client({ token: context.auth, sandbox: false });
      const noteStore = client.getNoteStore();
      
      const filter = new noteStore.constructor.NoteFilter();
      filter.words = query;
      filter.maxNotes = maxResults || 20;
      
      if (notebook) {
        filter.notebookGuid = notebook as string;
      }
      if (tag) {
        filter.tagGuids = [tag as string];
      }

      const searchResults = await noteStore.findNotes(filter, 0, maxResults || 20);
      return searchResults;
    } catch (error) {
      console.error('Error searching notes:', error);
      throw new Error(`Failed to search notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
