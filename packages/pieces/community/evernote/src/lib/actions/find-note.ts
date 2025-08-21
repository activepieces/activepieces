import {
  createAction,
  OAuth2PropertyValue,
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
      const params = new URLSearchParams({
        query: query,
        maxNotes: (maxResults || 20).toString(),
      });

      if (notebook) {
        params.append('notebookGuid', notebook as string);
      }
      if (tag) {
        params.append('tagGuid', tag as string);
      }

      const response = await fetch(`https://www.evernote.com/edam/note/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(context.auth as OAuth2PropertyValue).access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to search notes: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const searchResults = await response.json();
      return searchResults;
    } catch (error) {
      console.error('Error searching notes:', error);
      throw new Error(`Failed to search notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
