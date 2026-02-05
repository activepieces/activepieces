import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { flipandoAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const getAllApps = createAction({
  auth: flipandoAuth,
  name: 'getAllApps',
  displayName: 'Get All Apps',
  description:
    'Retrieves all the applications created by the authenticated user.',
  props: {},
  async run(context) {
    const apiKey = context.auth.secret_text;
    return await makeRequest(
      apiKey,
      HttpMethod.GET,
      '/integrations/applications',
      {
        max_results: 20,
      }
    );
  },
});
