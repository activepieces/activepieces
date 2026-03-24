import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { novuAuth } from '../..';

export const triggerEvent = createAction({
  auth: novuAuth,
  name: 'trigger_event',
  displayName: 'Send Notification',
  description: 'Trigger a notification workflow for a subscriber',
  props: {
    workflow_id: Property.ShortText({
      displayName: 'Workflow Trigger Identifier',
      description: 'The trigger identifier of your Novu workflow',
      required: true,
    }),
    subscriber_id: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The subscriber to send the notification to',
      required: true,
    }),
    payload: Property.Object({
      displayName: 'Payload',
      description:
        'Key-value pairs passed to the workflow template as variables',
      required: false,
    }),
    overrides: Property.Object({
      displayName: 'Overrides',
      description: 'Provider-specific overrides (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { workflow_id, subscriber_id, payload, overrides } =
      context.propsValue;

    const body: Record<string, unknown> = {
      name: workflow_id,
      to: { subscriberId: subscriber_id },
    };
    if (payload && Object.keys(payload).length > 0) {
      body['payload'] = payload;
    }
    if (overrides && Object.keys(overrides).length > 0) {
      body['overrides'] = overrides;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.novu.co/v1/events/trigger',
      body,
      headers: {
        Authorization: `ApiKey ${context.auth}`,
      },
      authentication: {
        type: AuthenticationType.CUSTOM,
      },
    });
    return response.body;
  },
});
