import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../..';

export const trackEvent = createAction({
  name: 'track_event',
  auth: klaviyoAuth,
  displayName: 'Track Event',
  description: 'Track a custom event for a profile.',
  props: {
    email: Property.ShortText({
      displayName: 'Profile Email',
      description: 'Email of the profile to associate the event with',
      required: true,
    }),
    metric_name: Property.ShortText({
      displayName: 'Metric Name',
      description: 'Name of the event metric (e.g., "Order Completed")',
      required: true,
    }),
    value: Property.Number({
      displayName: 'Value',
      description: 'Numeric value associated with the event (optional)',
      required: false,
    }),
    properties: Property.Object({
      displayName: 'Properties',
      description: 'Custom properties as key-value pairs (optional)',
      required: false,
    }),
    time: Property.DateTime({
      displayName: 'Event Time',
      description: 'When the event occurred (defaults to now)',
      required: false,
    }),
  },
  async run(context) {
    const eventData: any = {
      data: {
        type: 'event',
        attributes: {
          metric: {
            data: {
              type: 'metric',
              attributes: {
                name: context.propsValue.metric_name,
              },
            },
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: context.propsValue.email,
              },
            },
          },
          properties: context.propsValue.properties || {},
        },
      },
    };
    if (context.propsValue.value !== undefined) {
      eventData.data.attributes.value = context.propsValue.value;
    }
    if (context.propsValue.time !== undefined) {
      eventData.data.attributes.time = new Date(context.propsValue.time).toISOString();
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://a.klaviyo.com/api/events',
      headers: {
        'Accept': 'application/json',
        'Revision': '2024-10-15',
        'Authorization': `Klaviyo-API-Key ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: eventData,
    });
    return response.body;
  },
});