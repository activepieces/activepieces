import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findTagByName = createAction({
  auth: klaviyoAuth,
  name: 'findTagByName',
  displayName: 'Find Tag by Name',
  description: '',
  props: {
    search_query: Property.ShortText({
      displayName: 'Search Tag By Name',
      description: 'Search Tag By Name',
      required: true,
    }),
  },
  async run(context) {
    const { search_query } = context.propsValue;
    const { api_key } = context.auth

    const filter = `equals(name,"${search_query}")`;

    const query = `?filter=${encodeURIComponent(filter)}&page[size]=20`;

    return await makeRequest(
      api_key,
      HttpMethod.GET,
      `/tags${query}`
    );
  },
});
