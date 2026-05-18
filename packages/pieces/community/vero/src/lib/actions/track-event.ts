import { createAction, Property } from '@activepieces/pieces-framework';
import { veroAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const trackEvent = createAction({
  auth: veroAuth,
  name: 'trackEvent',
  displayName: 'Track Event',
  description: 'Track a custom event for a user',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'Unique database identifier for the user',
      required: true,
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      description: 'Email address of the user',
      required: true,
    }),
    eventName: Property.ShortText({
      displayName: 'Event Name',
      description: 'Name of the event being tracked',
      required: true,
    }),
    eventData: Property.Object({
      displayName: 'Event Data',
      description: 'Event-specific data and properties',
      required: false,
    }),

    extras: Property.Object({
      displayName: 'Extras',
      description:
        'Additional metadata for the event (e.g., source, createdAt)',
      required: false,
    }),
  },
  async run(context) {
    const { userId, userEmail, eventName, eventData, extras } =
      context.propsValue;

    const payload: any = {
      user: {
        id: userId,
        email: userEmail,
      },
      eventName,
    };

    if (eventData) {
      payload.data = eventData;
    }

    if (extras) {
      payload.extras = extras;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/events/track',
      payload
    );

    return response;
  },
});
