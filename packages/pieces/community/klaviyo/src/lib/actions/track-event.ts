import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const trackEventAction = createAction({
  auth: klaviyoAuth,
  name: 'track_event',
  displayName: 'Track Event',
  description: 'Create / track an event for a profile in Klaviyo.',
  props: {
    metric_name: Property.ShortText({
      displayName: 'Metric Name',
      description: 'Name of the event metric (e.g., "Placed Order", "Viewed Product")',
      required: true,
    }),
    profile_email: Property.ShortText({
      displayName: 'Profile Email',
      description: 'Email address of the profile to associate this event with',
      required: false,
    }),
    profile_id: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Klaviyo profile ID (use instead of or along with email)',
      required: false,
    }),
    value: Property.Number({
      displayName: 'Value',
      description: 'Numeric value associated with the event (e.g., order total)',
      required: false,
    }),
    event_properties: Property.Object({
      displayName: 'Event Properties',
      description: 'Custom event properties as key-value pairs',
      required: false,
    }),
    occurred_at: Property.ShortText({
      displayName: 'Occurred At',
      description:
        'ISO 8601 timestamp when the event occurred (defaults to current time)',
      required: false,
    }),
  },
  async run(context) {
    const {
      metric_name,
      profile_email,
      profile_id,
      value,
      event_properties,
      occurred_at,
    } = context.propsValue;

    if (!profile_email && !profile_id) {
      throw new Error('Provide at least a profile email or profile ID.');
    }

    const profile: Record<string, unknown> = {};
    if (profile_id) profile['id'] = profile_id;
    if (profile_email) profile['email'] = profile_email;

    const attributes: Record<string, unknown> = {
      metric: {
        data: {
          type: 'metric',
          attributes: { name: metric_name },
        },
      },
      profile: {
        data: {
          type: 'profile',
          attributes: profile,
        },
      },
      properties: event_properties ?? {},
    };

    if (value !== undefined && value !== null) {
      attributes['value'] = value;
    }

    if (occurred_at) {
      attributes['occurred_at'] = occurred_at;
    }

    return klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/events',
      body: {
        data: {
          type: 'event',
          attributes,
        },
      },
    });
  },
});
