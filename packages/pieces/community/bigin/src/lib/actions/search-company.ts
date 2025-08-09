import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const searchCompany = createAction({
  auth: biginAuth,
  name: 'searchCompany',
  displayName: 'Search Company',
  description: 'Look up companies by full name',
  props: {
    searchCriteria: Property.ShortText({
      displayName: 'Search Criteria',
      description: 'Enter the company name to search for',
      required: true,
    }),
  },
  async run(context) {
    const searchCriteria = context.propsValue.searchCriteria;

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.GET,
      `/Accounts/search?word=${searchCriteria.toString()}`,
      context.auth.props?.['location'] || 'com'
    );

    return {
      companies: response.data.companies || [],
    };
  },
});
