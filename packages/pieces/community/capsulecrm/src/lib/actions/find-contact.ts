import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CapsuleCRMAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const findContact = createAction({
  auth: CapsuleCRMAuth,
  name: 'findContact',
  displayName: 'Find Contact',
  description: 'Search for a person or organization in Capsule CRM',
  props: {
    searchterm: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term e.g., name, phone, postcode',
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
      q: propsValue.searchterm,
      page: propsValue.page?.toString() || '1',
      perPage: propsValue.perPage?.toString() || '50',
    };

    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      '/parties/search',
      undefined,
      queryParams
    );

    return response;
  },
});
