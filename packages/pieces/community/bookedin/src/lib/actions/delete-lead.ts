import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bookedinAuth } from '../../index';
import { BASE_URL, getBookedinHeaders } from '../common/props';

export const deleteLead = createAction({
  name: 'deleteLead',
  displayName: 'Delete Lead',
  description: 'Remove a lead from Bookedin AI by ID',
  auth: bookedinAuth,
  props: {
    lead_id: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead to delete (e.g., cus_...)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    
    const apiKey = typeof auth === 'string' 
      ? auth 
      : (auth as any)?.secret_text || (auth as any)?.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${BASE_URL}/leads/${propsValue.lead_id}`,
      headers: getBookedinHeaders(apiKey as string),
    });

    return response.body;
  },
});