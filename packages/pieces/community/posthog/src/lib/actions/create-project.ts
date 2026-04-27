import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { posthogAuth } from '../..';

export const posthogCreateProject = createAction({
  auth: posthogAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new PostHog project',
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The name of the new project',
      required: true,
    }),
    anonymize_ips: Property.Checkbox({
      displayName: 'Anonymize IPs',
      description: 'Whether to anonymize incoming IP addresses',
      required: false,
    }),
  },
  async run(context) {
    const { personal_api_key, host } = context.auth;
    const baseUrl = host || 'https://app.posthog.com';

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/api/projects/`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: personal_api_key,
      },
      body: {
        name: context.propsValue.name,
        anonymize_ips: context.propsValue.anonymize_ips,
      },
    });

    return result.body;
  },
});
