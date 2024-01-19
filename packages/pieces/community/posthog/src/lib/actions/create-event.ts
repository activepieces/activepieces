import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { EventBody, EventCaptureResponse } from '../common/models';
import { posthogAuth } from '../..';

export const posthogCreateEvent = createAction({
  auth: posthogAuth,
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Create an event inside a project',
  props: {
    event: Property.ShortText({
      displayName: 'Event name',
      description: 'The event name',
      required: true,
    }),
    event_type: Property.StaticDropdown({
      displayName: 'Event type',
      required: true,
      options: {
        options: [
          { label: 'Alias', value: 'alias' },
          { label: 'Capture', value: 'capture' },
          { label: 'Identify', value: 'screen' },
          { label: 'Page', value: 'page' },
          { label: 'Screen', value: 'screen' },
        ],
      },
    }),
    distinct_id: Property.ShortText({
      displayName: 'Distinct Id',
      description: "User's Distinct Id",
      required: true,
    }),
    properties: Property.Object({
      displayName: 'Properties',
      description: 'The event properties',
      required: false,
    }),
    context: Property.Object({
      displayName: 'Context',
      description: 'The event context,',
      required: false,
    }),
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The message id,',
      required: false,
    }),
    category: Property.ShortText({
      displayName: 'Category',
      description: 'The event category.',
      required: false,
    }),
  },
  async run(context) {
    const body: EventBody = {
      event: context.propsValue.event,
      type: context.propsValue.event_type!,
      api_key: context.auth,
      messageId: context.propsValue.message_id,
      context: context.propsValue.context || {},
      properties: context.propsValue.properties || {},
      distinct_id: context.propsValue.distinct_id,
      category: context.propsValue.category,
    };

    const request: HttpRequest<EventBody> = {
      method: HttpMethod.POST,
      url: `https://app.posthog.com/capture/`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    };

    const result = await httpClient.sendRequest<EventCaptureResponse>(request);
    console.debug('Event creation response', result);

    if (result.status === 200) {
      return result.body;
    }

    return result;
  },
});
