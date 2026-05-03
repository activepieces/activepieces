import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { salesloftAuth } from '../auth';
import { salesloftRequest } from '../common/client';

export const listCadencesAction = createAction({
  name: 'list_cadences',
  displayName: 'List Cadences',
  description: 'Fetch a paginated list of cadences from Salesloft.',
  auth: salesloftAuth,
  props: {
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of results per page (max 100).',
      required: false,
      defaultValue: 25,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (1-indexed).',
      required: false,
      defaultValue: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};

    if (propsValue.per_page) {
      queryParams['per_page'] = String(propsValue.per_page);
    }
    if (propsValue.page) {
      queryParams['page'] = String(propsValue.page);
    }

    return salesloftRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/cadences',
      queryParams,
    });
  },
});
