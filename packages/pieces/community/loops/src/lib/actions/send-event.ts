import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth } from '../auth';
import { loopsClient } from '../common/client';
import { loopsProps, loopsSchemas } from '../common/schemas';

const RESERVED_EVENT_FIELDS = new Set(['eventName', 'email', 'userId', 'eventProperties', 'mailingLists']);

export const sendEvent = createAction({
  name: 'send_event',
  classification: 'WRITE',
  displayName: 'Send Event',
  description:
    'Sends an event to Loops for a contact. Events can trigger email automations configured in your Loops dashboard.',
  audience: 'both',
  outputSchema: loopsSchemas.success,
  aiMetadata: {
    description:
      'Sends a named event for a contact to Loops, which can trigger email automations configured in the dashboard. The contact is identified by email or internal user ID (at least one required) and is created if missing. If both are given, Loops matches on either one and overwrites the other on the matched contact. Send only one unless you mean to change the other. Can attach event properties, update mailing-list memberships and set contact properties. Not idempotent: each call records a new event, unless the same idempotencyKey is reused within 24 hours (Loops then rejects it with 409).',
    idempotent: false,
  },
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
    mailingLists: Property.Object({
      displayName: 'Mailing Lists',
      description:
        'Mailing list IDs as keys with `true` (subscribe) or `false` (unsubscribe) as values. Use "List Mailing Lists" to find the IDs.',
      required: false,
    }),
    contactProperties: Property.Object({
      displayName: 'Contact Properties',
      description:
        'Optional contact property updates to apply when the event is sent. Keys eventName, email, userId, eventProperties and mailingLists are ignored.',
      required: false,
    }),
    idempotencyKey: loopsProps.idempotencyKeyProp(),
  },
  async run(context) {
    const { email, userId, eventName, eventProperties, mailingLists, contactProperties, idempotencyKey } =
      context.propsValue;

    if (!email && !userId) {
      throw new Error('Either "Email" or "User ID" must be provided.');
    }

    const contactFields: Record<string, unknown> = {};
    if (loopsClient.isRecord(contactProperties)) {
      for (const [key, value] of Object.entries(contactProperties)) {
        if (!RESERVED_EVENT_FIELDS.has(key)) {
          contactFields[key] = value;
        }
      }
    }

    const body: Record<string, unknown> = { ...contactFields, eventName };
    if (email) body['email'] = email;
    if (userId) body['userId'] = userId;
    if (loopsClient.isRecord(eventProperties)) body['eventProperties'] = eventProperties;
    if (loopsClient.isRecord(mailingLists)) body['mailingLists'] = mailingLists;

    return loopsClient.request<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/events/send',
      body,
      idempotencyKey: idempotencyKey?.trim() || undefined,
    });
  },
});
