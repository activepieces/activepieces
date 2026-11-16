import { createAction } from '@activepieces/pieces-framework';
import { seventeenTrackAuth } from '../auth';
import { seventeenTrackClient } from '../client';

export const getQuota = createAction({
  name: 'get_quota',
  classification: 'READ',
  displayName: 'Get Quota',
  description: 'Get the current tracking and email quota counters for the 17TRACK account',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the 17TRACK account quota counters: total, used, remaining, today used, daily limit and free email quota. Read-only and idempotent.',
    idempotent: true,
  },
  auth: seventeenTrackAuth,
  props: {},
  async run(context) {
    return await seventeenTrackClient.getQuota({
      apiKey: context.auth.secret_text,
    });
  },
});
