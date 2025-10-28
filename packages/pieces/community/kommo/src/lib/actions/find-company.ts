import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../../index';

export const findCompanyAction = createAction({
  auth: kommoAuth,
  name: 'find_company',
  displayName: 'Find Company',
  description: 'Find an existing company.',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      required: true,
      description: 'Search query (Searches through the filled fields of the company).'
    }),
  },
  async run(context) {
    const { query } = context.propsValue;
    const { subdomain, apiToken } = context.auth as {
      subdomain: string;
      apiToken: string;
    };

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.GET,
      `/companies?query=${encodeURIComponent(query || '')}`
    );

    const companies = result?._embedded?.companies ?? [];

    return {
      found: companies.length > 0,
      result: companies
    };
  },
});
