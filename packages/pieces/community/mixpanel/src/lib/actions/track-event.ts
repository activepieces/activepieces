import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { mixpanelAuth } from '../../index';

const API_URL = 'https://api.mixpanel.com';

export const trackEvent = createAction({
  name: 'track_event',
  auth: mixpanelAuth,
  displayName: 'Track Event',
  description: 'Send an Event to Mixpanel.',
  props: {
    event: Property.ShortText({
      displayName: 'Event',
      description:
        "A name for this Event. For example, 'Brand Mentioned in Tweet' or 'Payment Made'.",
      required: true,
    }),
    distinct_id: Property.ShortText({
      displayName: 'Distinct ID (Profile ID)',
      description:
        'A way to uniquely identify your users (or more generally, profiles). If you are sending Profiles to Mixpanel in addition to events, this property value should be identical to the Distinct ID property attached to the Profile so that you can connect events to people records.',
      required: false,
    }),
    event_properties: Property.Object({
      displayName: 'Event Properties',
      description:
        "Event Properties are bits of extra information that you send along with your Events describing the details of that action. They are usually specific to the Event they’re describing and don’t apply universally to other Events. Leveraging Event Properties allows you to conduct deeper analysis to better understand user behavior for a specific action. For example, a 'Song Added to Playlist' event could have 'Artist' and 'Playlist' as the properties. Properties are sent as key-value pairs where the key is the property name and the value is the property value.",
      required: false,
    }),
  },
  async run(context) {
    const projectToken = context.auth;
    const { event, distinct_id, event_properties } = context.propsValue;

    const eventPayload = [
      {
        event,
        properties: {
          time: Math.floor(Date.now() / 1000),
          distinct_id,
          ...event_properties,
        },
      },
    ];

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${API_URL}/import`,
      body: eventPayload,
      headers: {
        'Content-Type': 'application/json',
      },
      authentication: {
        type: AuthenticationType.BASIC,
        username: projectToken,
        password: '',
      },
    });

    return response;
  },
});
