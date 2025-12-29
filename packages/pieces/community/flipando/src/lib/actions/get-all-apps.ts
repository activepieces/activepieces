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
  props: {
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of results to return.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const maxResults = context.propsValue.max_results;

    return await makeRequest(
      apiKey,
      HttpMethod.GET,
      '/integrations/applications',
      {
        max_results: maxResults,
      }
    );
  },
});
