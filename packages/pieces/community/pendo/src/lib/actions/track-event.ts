import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pendoAuth } from '../auth';

export const trackEvent = createAction({
  auth: pendoAuth,
  name: 'track_event',
  displayName: 'Track Event',
  description: 'Send a track event to Pendo.',
  audience: 'both',
  aiMetadata: { description: 'Sends a custom track event to Pendo for a given visitor (and optionally an account), recording product-usage activity for analytics. Choose this to log a behavioral/usage event; requires an event type/name and a visitor ID, with optional account ID, millisecond timestamp (defaults to now), and arbitrary event properties. Not idempotent — each call appends a new event.', idempotent: false },
  props: {
    type: Property.ShortText({
      displayName: 'Event Type',
      description: 'The type/name of the track event.',
      required: true,
    }),
    visitorId: Property.ShortText({
      displayName: 'Visitor ID',
      description: 'The unique identifier for the visitor.',
      required: true,
    }),
    accountId: Property.ShortText({
      displayName: 'Account ID',
      description: 'The account identifier the visitor belongs to.',
      required: false,
    }),
    timestamp: Property.Number({
      displayName: 'Timestamp (ms)',
      description:
        'Unix timestamp in milliseconds. Defaults to the current time if not provided.',
      required: false,
    }),
    properties: Property.Object({
      displayName: 'Event Properties',
      description: 'Additional key-value properties for the event.',
      required: false,
    }),
  },
  async run(context) {
    const { type, visitorId, accountId, timestamp, properties } =
      context.propsValue;

    const body: Record<string, unknown> = {
      type: 'track',
      event: type,
      visitorId,
      ...(accountId ? { accountId } : {}),
      timestamp: timestamp ?? Date.now(),
      properties: properties ?? {},
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://app.pendo.io/data/track',
      headers: {
        'x-pendo-integration-key': context.auth.secret_text,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
