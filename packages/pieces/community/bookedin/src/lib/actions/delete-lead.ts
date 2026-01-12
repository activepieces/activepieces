import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bookedinAuth } from '../../index';
import { BASE_URL, getBookedinHeaders, leadIdDropdown, extractApiKey } from '../common/props';

export const deleteLead = createAction({
  name: 'deleteLead',
  displayName: 'Delete Lead',
  description: 'Delete a lead.',
  auth: bookedinAuth,
  props: {
    lead_id: leadIdDropdown,
  },
  async run({ auth, propsValue }) {
    const apiKey = extractApiKey(auth);

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${BASE_URL}/leads/${propsValue.lead_id}`,
      headers: getBookedinHeaders(apiKey),
    });

    return response.body;
  },
});