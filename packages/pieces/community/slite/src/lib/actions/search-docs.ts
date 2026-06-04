import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sliteAuth } from '../auth';
import { sliteApi } from '../common/client';
import { sliteProps } from '../common/props';
import { SliteSearchResponse } from '../common/types';

export const sliteSearchDocsAction = createAction({
  auth: sliteAuth,
  name: 'search_docs',
  displayName: 'Search Docs',
  description: 'Performs a keyword search across the docs you have access to.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Term',
      description: 'The keywords to search for.',
      required: true,
    }),
    parent_note_id: sliteProps.noteId({
      required: false,
      displayName: 'Parent Doc',
      description: 'Limit results to docs nested under this parent.',
    }),
    include_archived: Property.Checkbox({
      displayName: 'Include Archived',
      description: 'Also search archived docs.',
      required: false,
      defaultValue: false,
    }),
    hits_per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'How many results to return per page (1–100).',
      required: false,
      defaultValue: 25,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Which page of results to return (starts at 0).',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { query, parent_note_id, include_archived, hits_per_page, page } =
      context.propsValue;
    const response = await sliteApi.call<SliteSearchResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/search-notes',
      query: {
        query,
        parentNoteId: parent_note_id,
        includeArchived: include_archived,
        hitsPerPage: hits_per_page,
        page,
      },
    });
    return response;
  },
});
