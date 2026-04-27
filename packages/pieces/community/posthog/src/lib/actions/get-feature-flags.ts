import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { posthogAuth } from '../..';

export const posthogGetFeatureFlags = createAction({
  auth: posthogAuth,
  name: 'get_feature_flags',
  displayName: 'Get Feature Flags',
  description: 'List all feature flags in your PostHog project',
  props: {},
  async run(context) {
    const { personal_api_key, project_id, host } = context.auth;
    const baseUrl = host || 'https://app.posthog.com';

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/api/projects/${project_id}/feature_flags/`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: personal_api_key,
      },
    });

    return result.body;
  },
});
