import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { CANVA_BASE_URL } from '../common';

export const findDesign = createAction({
  auth: canvaAuth,
  name: 'find_design',
  displayName: 'Find Design',
  description: "Search the user's Canva designs by keyword.",
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: "Keyword to search for among the user's designs (max 255 characters).",
      required: true,
    }),
    ownership: Property.StaticDropdown({
      displayName: 'Ownership',
      description: 'Filter designs by ownership.',
      required: false,
      defaultValue: 'any',
      options: {
        options: [
          { label: 'Any (owned and shared)', value: 'any' },
          { label: 'Owned by me', value: 'owned' },
          { label: 'Shared with me', value: 'shared' },
        ],
      },
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'How to sort the results.',
      required: false,
      defaultValue: 'relevance',
      options: {
        options: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Last Modified (newest first)', value: 'modified_descending' },
          { label: 'Last Modified (oldest first)', value: 'modified_ascending' },
          { label: 'Title (A–Z)', value: 'title_ascending' },
          { label: 'Title (Z–A)', value: 'title_descending' },
        ],
      },
    }),
  },
  async run(context) {
    const { query, ownership, sortBy } = context.propsValue;
    const params = new URLSearchParams({ query });
    if (ownership) params.set('ownership', ownership);
    if (sortBy) params.set('sort_by', sortBy);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${CANVA_BASE_URL}/designs?${params.toString()}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return response.body;
  },
});
