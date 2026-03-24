import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { screenpipeAuth } from '../..';

export const checkHealth = createAction({
  auth: screenpipeAuth,
  name: 'check_health',
  displayName: 'Check Health',
  description: 'Check if the Screenpipe server is running and healthy',
  props: {},
  async run({ auth }) {
    const baseUrl = auth.props.base_url.replace(/\/$/, '');

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/health`,
    });

    return response.body;
  },
});
