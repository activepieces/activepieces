import { createAction, Property } from '@activepieces/pieces-framework';
import { loopsAuth, LOOPS_BASE_URL, loopsAuthHeaders } from '../auth';

export const sendEvent = createAction({
  name: 'send_event',
  displayName: 'Send Event',
  description:
    'Sends an event to Loops for a contact. Events can trigger email automations configured in your Loops dashboard.',
  auth: loopsAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact to send the event for.',
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'Your internal user ID of the contact (used if email is not provided).',
      required: false,
    }),
    eventName: Property.ShortText({
      displayName: 'Event Name',
      description:
        'The name of the event to send (e.g. "signup", "purchase", "password-reset"). Must match an event set up in Loops.',
      required: true,
    }),
    eventProperties: Property.Object({
      displayName: 'Event Properties',
      description: 'Optional key-value pairs to attach to the event (used in email templates).',
      required: false,
    }),
    contactProperties: Property.Object({
      displayName: 'Contact Properties',
      description:
        'Optional contact property updates to apply when the event is sent.',
      required: false,
    }),
  },
  async run(context) {
    const { email, userId, eventName, eventProperties, contactProperties } = context.propsValue;

    if (!email && !userId) {
      throw new Error('Either "Email" or "User ID" must be provided.');
    }

    const body: Record<string, unknown> = { eventName };

    if (email) body['email'] = email;
    if (userId) body['userId'] = userId;

    if (eventProperties && typeof eventProperties === 'object') {
      body['eventProperties'] = eventProperties;
    }

    if (contactProperties && typeof contactProperties === 'object') {
      body['contactProperties'] = contactProperties;
    }

    const response = await fetch(`${LOOPS_BASE_URL}/events/send`, {
      method: 'POST',
      headers: loopsAuthHeaders(context.auth as string),
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Loops API error ${response.status}: ${JSON.stringify(data)}`
      );
    }

    return data;
  },
});
