import { createAction, Property } from '@activepieces/pieces-framework';
import { seventeenTrackAuth } from '../auth';
import { seventeenTrackClient } from '../client';

export const getRealtimeTrackingDetails = createAction({
  name: 'get_realtime_tracking_details',
  classification: 'READ',
  displayName: 'Get Realtime Tracking Details',
  description:
    'Query a single tracking number against carriers in real time; Standard mode (cacheLevel 0) costs 1 quota, Instant mode (cacheLevel 1) costs 10 quota',
  audience: 'both',
  aiMetadata: {
    description:
      'Queries a single tracking number against carriers in real time. cacheLevel 0 returns carrier data from the last 3 hours and costs 1 quota; cacheLevel 1 triggers an immediate carrier fetch and costs 10 quota. Read-only.',
    idempotent: true,
  },
  auth: seventeenTrackAuth,
  props: {
    number: Property.ShortText({
      displayName: 'Tracking Number',
      description: 'The tracking number to query in real time',
      required: true,
    }),
    cacheLevel: Property.StaticDropdown({
      displayName: 'Cache Level',
      description: 'Standard returns data cached within the last 3 hours (1 quota); Instant fetches immediately (10 quota)',
      required: false,
      defaultValue: 0,
      options: {
        options: [
          { label: 'Standard (cacheLevel 0, 1 quota)', value: 0 },
          { label: 'Instant (cacheLevel 1, 10 quota)', value: 1 },
        ],
      },
    }),
  },
  async run(context) {
    const { number, cacheLevel } = context.propsValue;
    return await seventeenTrackClient.getRealtimeTrackingDetails({
      apiKey: context.auth.secret_text,
      tracking: {
        number,
        ...(cacheLevel !== undefined && cacheLevel !== null ? { cacheLevel: cacheLevel as 0 | 1 } : {}),
      },
    });
  },
});
