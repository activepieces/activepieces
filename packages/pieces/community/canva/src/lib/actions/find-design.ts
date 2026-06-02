import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { canvaApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const canvaFindDesign = createAction({
  auth: canvaAuth,
  name: 'find_design',
  displayName: 'Find Design',
  description: 'Search for designs in Canva.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Keywords to search for in design titles.',
      required: false,
    }),
    ownership: Property.StaticDropdown({
      displayName: 'Ownership',
      description: 'Filter designs by ownership.',
      required: false,
      defaultValue: 'owned',
      options: {
        disabled: false,
        options: [
          { label: 'Owned by me', value: 'owned' },
          { label: 'Shared with me', value: 'shared' },
          { label: 'Any', value: 'any' },
        ],
      },
    }),
  },
  async run(context) {
    const { query, ownership } = context.propsValue;
    const accessToken = context.auth.access_token;

    const queryParams: Record<string, string> = {};

    if (query) {
      queryParams['query'] = query;
    }

    if (ownership) {
      queryParams['ownership'] = ownership;
    }

    const result = await canvaApiCall<{ items: unknown[]; continuation?: string }>({
      accessToken,
      method: HttpMethod.GET,
      resourceUrl: '/designs',
      queryParams,
    });

    return result;
  },
});
