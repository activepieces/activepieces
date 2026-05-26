import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
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
    const { project_api_key, host } = context.auth.props;
    const baseUrl = host || 'https://app.posthog.com';

    const result = await httpClient.sendRequest<{ status: number }>({
      method: HttpMethod.POST,
      url: `${baseUrl}/capture/`,
      body: {
        api_key: project_api_key,
        distinct_id: context.propsValue.distinct_id,
        event: context.propsValue.event,
        properties: context.propsValue.properties ?? {},
      },
    });

    return result.body;
  },
});
