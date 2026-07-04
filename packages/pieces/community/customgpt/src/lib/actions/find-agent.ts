import { createAction, Property } from '@activepieces/pieces-framework';
import { customgptAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { tr } from 'zod/v4/locales';

export const findAgent = createAction({
  auth: customgptAuth,
  name: 'findAgent',
  displayName: 'Find Agent',
  description: 'Find Agent by name ',
  props: {
    name: Property.ShortText({
      displayName: 'Agent Name Filter',
      description: 'Filter agents by name (optional)',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const queryParams: any = {};

    queryParams.order = 'desc';
    queryParams.orderBy = 'created_at';
    if (name) queryParams.name = name;

    const queryString =
      Object.keys(queryParams).length > 0
        ? '?' + new URLSearchParams(queryParams).toString()
        : '';

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      `/projects${queryString}`
    );

    return response;
  },
});
