import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findListByName = createAction({
  auth: klaviyoAuth,
  name: 'findListByName',
  displayName: 'Find List by Name',
  description: '',
  props: {
    search_query: Property.ShortText({
      displayName: 'Search list By Name',
      description: 'Search list By Name',
      required: true,
    }),
  },
  async run(context) {
    
    const { search_query } = context.propsValue;
    const { api_key } = context.auth

    const filter = `equals(name,"${search_query}")`;

    // Build query string
    const query = `?filter=${encodeURIComponent(filter)}&page[size]=20`;

    // Make the request
    return await makeRequest(
      api_key,
      HttpMethod.GET,
      `/profiles${query}`
    );
  },
});
