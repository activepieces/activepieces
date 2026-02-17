import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../';

export const canvaFindDesign = createAction({
  auth: canvaAuth,
  name: 'find_canva_design',
  description: 'Search for designs in Canva by query',
  displayName: 'Find Design',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The search query to find designs.',
      required: true,
    }),
    ownership: Property.StaticDropdown({
      displayName: 'Ownership',
      description: 'Filter designs by ownership.',
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Owned by Me', value: 'owned' },
          { label: 'Shared with Me', value: 'shared' },
        ],
      },
      defaultValue: 'any',
      required: false,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'How to sort the results.',
      options: {
        options: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Modified (Descending)', value: 'modified_descending' },
          { label: 'Modified (Ascending)', value: 'modified_ascending' },
          { label: 'Title (Ascending)', value: 'title_ascending' },
          { label: 'Title (Descending)', value: 'title_descending' },
        ],
      },
      defaultValue: 'relevance',
      required: false,
    }),
  },
  async run(context) {
    const { query, ownership, sort_by } = context.propsValue;

    const queryParams: Record<string, string> = {
      query,
    };

    if (ownership && ownership !== 'any') {
      queryParams['ownership'] = ownership;
    }

    if (sort_by) {
      queryParams['sort_by'] = sort_by;
    }

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: 'https://api.canva.com/rest/v1/designs',
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    };

    const result = await httpClient.sendRequest(request);

    return result.body;
  },
});
