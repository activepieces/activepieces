import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { ListDesignsResponse } from '../common/types';

export const findDesignAction = createAction({
  auth: canvaAuth,
  name: 'find_design',
  displayName: 'Find Design',
  description: 'Search for designs by title or query',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term to find designs by title',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of designs to return (1-100)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { query, limit } = context.propsValue;

    const queryParams: Record<string, string> = {};

    if (query) {
      queryParams.query = query;
    }

    if (limit) {
      queryParams.limit = Math.min(Math.max(limit, 1), 100).toString();
    }

    const response = await canvaApiCall<ListDesignsResponse>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/designs',
      queryParams,
    });

    return {
      items: response.items,
      count: response.items.length,
      continuation: response.continuation,
    };
  },
});
