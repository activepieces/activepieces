import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { posthogAuth } from '../..';

export const posthogListPersons = createAction({
  auth: posthogAuth,
  name: 'list_persons',
  displayName: 'List Persons',
  description: 'Get a list of identified users in your PostHog project',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of persons to return (default: 100)',
      required: false,
      defaultValue: 100,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter persons by email or name',
      required: false,
    }),
  },
  async run(context) {
    const { personal_api_key, project_id, host } = context.auth;
    const baseUrl = host || 'https://app.posthog.com';

    const params = new URLSearchParams({
      limit: String(context.propsValue.limit || 100),
    });
    if (context.propsValue.search) {
      params.set('search', context.propsValue.search);
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/api/projects/${project_id}/persons/?${params.toString()}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: personal_api_key,
      },
    });

    return result.body;
  },
});
