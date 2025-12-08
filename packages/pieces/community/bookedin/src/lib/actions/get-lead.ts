import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bookedinAuth } from '../../index';
import { BASE_URL, getBookedinHeaders } from '../common/props';

export const getLead = createAction({
  name: 'getLead',
  displayName: 'Get Lead',
  description: 'Get a specific lead by ID.',
  auth: bookedinAuth,
  props: {
    lead_id: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead to retrieve (e.g., cus_...)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    // Robust extraction
    const apiKey = typeof auth === 'string' 
      ? auth 
      : (auth as any)?.secret_text || (auth as any)?.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${BASE_URL}/leads/${propsValue.lead_id}`,
      headers: getBookedinHeaders(apiKey as string),
    });

    return response.body;
  },
});