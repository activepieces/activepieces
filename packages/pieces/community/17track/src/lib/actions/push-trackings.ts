import { createAction, Property } from '@activepieces/pieces-framework';
import { seventeenTrackAuth } from '../auth';
import { seventeenTrackClient } from '../client';

const parseNumbers = (raw: string): string[] =>
  raw
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter((item) => /^[A-Za-z0-9-]{5,50}$/.test(item));

export const pushTrackings = createAction({
  name: 'push_trackings',
  classification: 'WRITE',
  displayName: 'Push Trackings',
  description: 'Queue a webhook push of the latest tracking results for up to 40 registered tracking numbers',
  audience: 'both',
  aiMetadata: {
    description:
      'Queues a webhook push of the latest tracking results for up to 40 registered tracking numbers, comma or newline separated. Requires a configured 17TRACK webhook. Read-write.',
    idempotent: false,
  },
  auth: seventeenTrackAuth,
  props: {
    numbers: Property.LongText({
      displayName: 'Tracking Numbers',
      description: 'Registered tracking numbers, comma or newline separated (max 40)',
      required: true,
    }),
  },
  async run(context) {
    const parsed = parseNumbers(context.propsValue.numbers ?? '');
    if (parsed.length === 0 || parsed.length > 40) {
      throw new Error('Provide between 1 and 40 valid tracking numbers');
    }
    return await seventeenTrackClient.pushTrackings({
      apiKey: context.auth.secret_text,
      trackings: parsed.map((number) => ({ number })),
    });
  },
});
