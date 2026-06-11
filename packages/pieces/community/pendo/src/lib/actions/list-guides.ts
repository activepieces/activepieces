import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pendoAuth } from '../auth';

export const listGuides = createAction({
  auth: pendoAuth,
  name: 'list_guides',
  displayName: 'List Guides',
  description: 'Retrieve all guides from your Pendo account.',
  audience: 'both',
  aiMetadata: { description: 'Lists all in-app guides configured in the authenticated Pendo account. Use to enumerate guides or to discover a guide ID for use in other steps. Takes no input. Read-only and idempotent.', idempotent: true },
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
