import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaApiCall } from '../common';
import { canvaAuth } from '../auth';

export const findDesignAction = createAction({
  auth: canvaAuth,
  name: 'find_design',
  displayName: 'Find Design',
  description: 'Searches for designs by query string.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Keywords to search for in design titles.',
      required: true,
    }),
    ownership: Property.StaticDropdown({
      displayName: 'Ownership',
      description: 'Filter designs by ownership.',
      required: false,
      defaultValue: 'ANY',
      options: {
        options: [
          { label: 'Any', value: 'ANY' },
          { label: 'Owned', value: 'OWNED' },
          { label: 'Shared', value: 'SHARED' },
        ],
      },
    }),
  },
  async run(context) {
    const { query, ownership } = context.propsValue;
    const accessToken = context.auth.access_token;

    const queryParams: Record<string, string> = { query };
    if (ownership && ownership !== 'ANY') {
      queryParams['ownership'] = ownership;
    }

    return canvaApiCall({
      accessToken,
      method: HttpMethod.GET,
      path: '/designs',
      queryParams,
    });
  },
});
