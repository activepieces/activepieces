import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pendoAuth } from '../auth';

export const listGuides = createAction({
  auth: pendoAuth,
  name: 'list_guides',
  displayName: 'List Guides',
  description: 'Retrieve all guides from your Pendo account.',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://app.pendo.io/api/v1/guide',
      headers: {
        'x-pendo-integration-key': context.auth.secret_text,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
