import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CapsuleCRMAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const findOpportunity = createAction({
  auth: CapsuleCRMAuth,
  name: 'findOpportunity',
  displayName: 'Find Opportunity',
  description: 'Search for an opportunity in Capsule CRM',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term (e.g., opportunity name, tag)',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: 'Results per Page',
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {
      q: propsValue.query,
      page: propsValue.page?.toString() || '1',
      perPage: propsValue.perPage?.toString() || '50',
    };


    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      '/opportunities/search',
      undefined,
      queryParams
    );

    return response;
  },
});
