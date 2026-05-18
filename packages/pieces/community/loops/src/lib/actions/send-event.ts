import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth, LOOPS_BASE_URL } from '../auth';

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
      description:
        'Your internal user ID of the contact (used if email is not provided).',
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
      description:
        'Optional key-value pairs to attach to the event (used in email templates).',
      required: false,
    }),
    mailingLists: Property.Object({
      displayName: 'Mailing Lists',
      description:
        'Subscribe or unsubscribe this contact from mailing lists. Provide list IDs as keys with `true` (subscribe) or `false` (unsubscribe) as values.',
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
    const { email, userId, eventName, eventProperties, mailingLists, contactProperties } =
      context.propsValue;

    if (!email && !userId) {
      throw new Error('Either "Email" or "User ID" must be provided.');
    }

    const body: Record<string, unknown> = { eventName };

    if (email) body['email'] = email;
    if (userId) body['userId'] = userId;

    if (eventProperties && typeof eventProperties === 'object') {
      body['eventProperties'] = eventProperties;
    }

    if (mailingLists && typeof mailingLists === 'object') {
      body['mailingLists'] = mailingLists;
    }

    if (contactProperties && typeof contactProperties === 'object') {
      Object.assign(body, contactProperties);
    }

    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.POST,
      url: `${LOOPS_BASE_URL}/events/send`,
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    });

    return response.body;
  },
});
