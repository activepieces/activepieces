import { createAction, Property } from '@activepieces/pieces-framework';
import { seventeenTrackAuth } from '../auth';
import { seventeenTrackClient } from '../client';

const parseNumbers = (raw: string): string[] =>
  raw
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter((item) => /^[A-Za-z0-9-]{5,50}$/.test(item));

export const getTrackingDetails = createAction({
  name: 'get_tracking_details',
  classification: 'READ',
  displayName: 'Get Tracking Details',
  description: 'Get current tracking details for up to 40 registered tracking numbers',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves current tracking details for up to 40 registered tracking numbers, comma or newline separated. Read-only and idempotent.',
    idempotent: true,
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
    return await seventeenTrackClient.getTrackingDetails({
      apiKey: context.auth.secret_text,
      trackings: parsed.map((number) => ({ number })),
    });
  },
});
