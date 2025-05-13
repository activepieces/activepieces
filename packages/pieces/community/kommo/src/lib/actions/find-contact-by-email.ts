import { createAction, Property } from '@activepieces/pieces-framework';
import { kommoAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findContactAction = createAction({
  auth: kommoAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Look up contacts by email address.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    })
  },
  async run(context) {
    const { email } = context.propsValue;
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.GET,
      `/contacts?query=${encodeURIComponent(email)}`
    );

    return result._embedded?.contacts || [];
  },
});
