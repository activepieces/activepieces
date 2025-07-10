import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findListByName = createAction({
  auth: klaviyoAuth,
  name: 'findListByName',
  displayName: 'Find List by Name',
  description: 'Search for a list by name ',
  props: {
    search_query: Property.ShortText({
      displayName: 'Search list By Name',
      description: 'Search list By Name',
      required: true,
    }),
  },
  async run({auth,propsValue}) {
    
    const { search_query } = propsValue;
    
    //equals(name,['example'])
    const filter = `equals(name,"['${search_query}']")`;

    // Build query string
    const query = `?filter=${encodeURIComponent(filter)}`;

    // Make the request
    return await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/lists${query}`
    );
  },
});
