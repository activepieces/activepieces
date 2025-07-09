import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findProfileByEmailPhone = createAction({
  auth: klaviyoAuth,
  name: 'findProfileByEmailPhone',
  displayName: 'Find Profile by Email Phone',
  description: '',
  props: {
    search_query: Property.ShortText({
      displayName: 'Email or Phone Number',
      description: 'Enter an email address or phone number to search for a profile.',
      required: true,
    }),
  },
  async run(context) {
    // Action logic here
    const { search_query } = context.propsValue;
    const { api_key } = context.auth

    let filter = '';
    if (search_query.includes('@')) {
      filter = `equals(email,"${search_query}")`;
    } else {
      filter = `equals(phone_number,"${search_query}")`;
    }

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
