import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../../index';

interface KommoAuth {
  subdomain: string;
  apiToken: string;
}

export const createLeadAction = createAction({
  auth: kommoAuth,
  name: 'create_lead',
  displayName: 'Create New Lead',
  description: 'Add a new sales lead.',
  props: {
    name: Property.ShortText({
      displayName: 'Lead Name',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Price',
      required: false,
    }),
  },
  async run(context) {
    const { name, price } = context.propsValue;
    const { apiToken, subdomain } = context.auth as KommoAuth;

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.POST,
      `/leads`,
      [{ name, price }]
    );

    return result;
  },
});
