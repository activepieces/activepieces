import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { ProjectCreateRequest, ProjectCreateResponse } from '../common/models';
import { posthogAuth } from '../..';

export const posthogCreateProject = createAction({
  auth: posthogAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a posthog project',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Project Name',
      required: false,
    }),
    slack_incoming_webhook: Property.ShortText({
      displayName: 'Slack Incoming Webhook',
      description: 'Slack incoming webhook',
      required: false,
    }),
    anonymize_ips: Property.Checkbox({
      displayName: 'Anonymize IPs',
      description: 'Whether to anonymize incoming IP addresses.',
      required: false,
    }),
    is_demo: Property.Checkbox({
      displayName: 'Is demo project',
      description: 'If this is a demo project',
      required: false,
    }),
  },
  async run(context) {
    const body: ProjectCreateRequest = {
      ...context.propsValue,
    };

    const request: HttpRequest<ProjectCreateRequest> = {
      method: HttpMethod.POST,
      url: `https://app.posthog.com/api/projects/`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    };

    const result = await httpClient.sendRequest<ProjectCreateResponse>(request);
    console.debug('Project creation response', result);

    if (result.status === 200) {
      return result.body;
    }

    return result;
  },
});
