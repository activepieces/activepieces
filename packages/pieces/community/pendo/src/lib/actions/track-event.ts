import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pendoAuth } from '../auth';
import { pendoRequest } from '../common/client';

export const trackEvent = createAction({
  auth: pendoAuth,
  name: 'track_event',
  displayName: 'Track Event',
  description: 'Send a track event to Pendo.',
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
      accountId: accountId ?? undefined,
      timestamp: timestamp ?? Date.now(),
      properties: properties ?? {},
    };

    return await pendoRequest(
      String(context.auth),
      HttpMethod.POST,
      '/track',
      body,
    );
  },
});
