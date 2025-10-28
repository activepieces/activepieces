import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../../index';

export const findLeadAction = createAction({
  auth: kommoAuth,
  name: 'find_lead',
  displayName: 'Find Lead',
  description: "Finds an existing lead.",
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      required: true,
      description: 'Search query (Searches through the filled fields of the lead).'
    }),
  },
  async run(context) {
    const { subdomain, apiToken } = context.auth

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.GET,
      `/leads?query=${encodeURIComponent(context.propsValue.query)}`
    );

    const leads = result?._embedded?.leads ?? [];

    return {
      found: leads.length > 0,
      result: leads
    };
  },
});
