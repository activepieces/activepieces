import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../';
import { callCanvaApi } from '../common';

export const findDesign = createAction({
  auth: canvaAuth,
  name: 'find_design',
  displayName: 'Find Design',
  description: 'Search for designs by query, with optional filters for ownership and sorting.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term to filter designs.',
      required: false,
    }),
    ownership: Property.StaticDropdown({
      displayName: 'Ownership',
      description: 'Filter designs by ownership.',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Owned by me', value: 'owned' },
          { label: 'Shared with me', value: 'shared' },
        ],
      },
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'How to sort the results.',
      required: false,
      options: {
        options: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Modified (Newest)', value: 'modified_descending' },
          { label: 'Modified (Oldest)', value: 'modified_ascending' },
          { label: 'Title (Z-A)', value: 'title_descending' },
          { label: 'Title (A-Z)', value: 'title_ascending' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of designs to return (1-100).',
      required: false,
    }),
  },
  async run(context) {
    const { query, ownership, sort_by, limit } = context.propsValue;
    const accessToken = getAccessTokenOrThrow(context.auth);

    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (ownership) params.append('ownership', ownership);
    if (sort_by) params.append('sort_by', sort_by);
    if (limit) params.append('limit', String(limit));

    const queryString = params.toString();
    const path = queryString ? `designs?${queryString}` : 'designs';

    const response = await callCanvaApi(HttpMethod.GET, path, accessToken);
    return response.body;
  },
});
