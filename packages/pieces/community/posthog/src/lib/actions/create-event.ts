import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../..';

export const posthogCreateEvent = createAction({
  auth: posthogAuth,
  name: 'create_event',
  displayName: 'Capture Event',
  description: 'Capture a custom event in PostHog',
  props: {
    event: Property.ShortText({
      displayName: 'Event Name',
      description: 'The name of the event to capture',
      required: true,
    }),
    distinct_id: Property.ShortText({
      displayName: 'Distinct ID',
      description:
        'Unique identifier for the user performing the action (e.g. user ID or email address)',
      required: true,
    }),
    properties: Property.Object({
      displayName: 'Properties',
      description: 'Additional event properties as key/value pairs',
      required: false,
    }),
  },
  async run(context) {
    const { personal_api_key, project_id, api_host, ingestion_host } = context.auth.props;
    const apiBase = api_host || 'https://us.posthog.com';
    const ingestionBase = ingestion_host || 'https://us.i.posthog.com';

    const projectResult = await httpClient.sendRequest<{ api_token: string }>({
      method: HttpMethod.GET,
      url: `${apiBase}/api/projects/${project_id}/`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: personal_api_key,
      },
    });

    const result = await httpClient.sendRequest<{ status: number }>({
      method: HttpMethod.POST,
      url: `${ingestionBase}/i/v0/e/`,
      body: {
        api_key: projectResult.body.api_token,
        distinct_id: context.propsValue.distinct_id,
        event: context.propsValue.event,
        properties: context.propsValue.properties ?? {},
      },
    });

    return result.body;
  },
});
