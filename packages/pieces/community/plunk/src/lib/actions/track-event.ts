import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { plunkAuth } from '../..';

export const plunkTrackEventAction = createAction({
  auth: plunkAuth,
  name: 'plunk_track_event',
  displayName: 'Track Event',
  description:
    'Track an event for a contact. If the contact does not exist, Plunk will create it automatically.',
  props: {
    event: Property.ShortText({
      displayName: 'Event Name',
      description: 'The name of the event to track (e.g. "user-signup").',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact.',
      required: true,
    }),
    subscribed: Property.Checkbox({
      displayName: 'Subscribed',
      description:
        'Whether the contact should be subscribed to marketing emails.',
      required: false,
      defaultValue: true,
    }),
    data: Property.Object({
      displayName: 'Data',
      description:
        'Additional metadata to attach to the event. This data will be stored on the contact.',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const body: Record<string, unknown> = {
      event: propsValue.event,
      email: propsValue.email,
    };

    if (propsValue.subscribed !== undefined) {
      body['subscribed'] = propsValue.subscribed;
    }
    if (propsValue.data && Object.keys(propsValue.data).length > 0) {
      body['data'] = propsValue.data;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.useplunk.com/v1/track',
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
