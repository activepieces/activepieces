import { createAction, Property } from '@activepieces/pieces-framework';
import { seventeenTrackAuth } from '../auth';
import { seventeenTrackClient } from '../client';

const parseNumbers = (raw: string): string[] =>
  raw
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter((item) => /^[A-Za-z0-9-]{5,50}$/.test(item));

export const restartTrackings = createAction({
  name: 'restart_tracking',
  classification: 'WRITE',
  displayName: 'Restart Trackings',
  description: 'Restart automatic tracking for up to 40 stopped tracking numbers; each number can only be restarted once',
  audience: 'both',
  aiMetadata: {
    description:
      'Restarts automatic tracking for up to 40 stopped tracking numbers, comma or newline separated. Each number can only be restarted once. Read-write.',
    idempotent: false,
  },
  auth: seventeenTrackAuth,
  props: {
    numbers: Property.LongText({
      displayName: 'Tracking Numbers',
      description: 'Stopped tracking numbers, comma or newline separated (max 40)',
      required: true,
    }),
  },
  async run(context) {
    const parsed = parseNumbers(context.propsValue.numbers ?? '');
    if (parsed.length === 0 || parsed.length > 40) {
      throw new Error('Provide between 1 and 40 valid tracking numbers');
    }
    return await seventeenTrackClient.restartTrackings({
      apiKey: context.auth.secret_text,
      trackings: parsed.map((number) => ({ number })),
    });
  },
});
