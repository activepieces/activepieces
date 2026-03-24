import { createAction, Property } from '@activepieces/pieces-framework';
import { amplitudeAuth } from '../../index';
import { amplitudeTrackEvents } from '../common';

export const trackEventAction = createAction({
  auth: amplitudeAuth,
  name: 'track_event',
  displayName: 'Track Event',
  description: 'Send an event to Amplitude for a specific user or device.',
  props: {
    event_type: Property.ShortText({
      displayName: 'Event Type',
      description: 'The name of the event, for example Page Viewed.',
      required: true,
    }),
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'A unique identifier for the user.',
      required: false,
    }),
    device_id: Property.ShortText({
      displayName: 'Device ID',
      description: 'A unique identifier for the device.',
      required: false,
    }),
    event_properties: Property.Object({
      displayName: 'Event Properties',
      description: 'Additional properties to attach to the event.',
      required: false,
    }),
  },
  async run(context) {
    const { event_type, user_id, device_id, event_properties } =
      context.propsValue;

    if (!user_id && !device_id) {
      throw new Error('At least one of User ID or Device ID is required.');
    }

    const event: {
      event_type: string;
      user_id?: string;
      device_id?: string;
      event_properties?: Record<string, unknown>;
    } = {
      event_type,
    };

    if (user_id) {
      event.user_id = user_id;
    }
    if (device_id) {
      event.device_id = device_id;
    }
    if (event_properties && Object.keys(event_properties).length > 0) {
      event.event_properties = event_properties as Record<string, unknown>;
    }

    return await amplitudeTrackEvents({
      apiKey: String(context.auth),
      events: [event],
    });
  },
});
