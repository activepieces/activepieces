import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CapsuleCRMAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const findProject = createAction({
  auth: CapsuleCRMAuth,
  name: 'findProject',
  displayName: 'Find Project',
  description: 'Search for a project in Capsule CRM',
  props: {
    searchTerm: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term (e.g., project name, tag)',
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
      q: propsValue.searchTerm,
      page: propsValue.page?.toString() || '1',
      perPage: propsValue.perPage?.toString() || '50',
    };


    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      '/kases/search',
      undefined,
      queryParams
    );

    return response;
  },
});
