import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const findDesign = createAction({
  auth: canvaAuth,
  name: 'find_design',
  displayName: 'Find Design',
  description: 'Search for designs by name or criteria',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term or terms (max 255 characters)',
      required: false,
    }),
    ownership: Property.StaticDropdown({
      displayName: 'Ownership',
      description: 'Filter by ownership type',
      required: false,
      defaultValue: 'any',
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Owned', value: 'owned' },
          { label: 'Shared', value: 'shared' },
        ],
      },
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort order for results',
      required: false,
      defaultValue: 'relevance',
      options: {
        options: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Modified (Descending)', value: 'modified_descending' },
          { label: 'Modified (Ascending)', value: 'modified_ascending' },
          { label: 'Title (Descending)', value: 'title_descending' },
          { label: 'Title (Ascending)', value: 'title_ascending' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of results to return (1-100)',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const query = context.propsValue.query;
    const ownership = context.propsValue.ownership;
    const sortBy = context.propsValue.sort_by;
    const limit = context.propsValue.limit;

    const queryParams: string[] = [];

    if (query) {
      queryParams.push(`query=${encodeURIComponent(query)}`);
    }

    if (ownership) {
      queryParams.push(`ownership=${ownership}`);
    }

    if (sortBy) {
      queryParams.push(`sort_by=${sortBy}`);
    }

    if (limit) {
      queryParams.push(`limit=${limit}`);
    }

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${canvaCommon.baseUrl}/${canvaCommon.designs}${queryString}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    };

    const response = await httpClient.sendRequest(request);

    return {
      success: true,
      designs: response.body,
    };
  },
});
