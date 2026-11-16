import { createAction, Property } from '@activepieces/pieces-framework';
import { seventeenTrackAuth } from '../auth';
import { seventeenTrackClient } from '../client';

const parseNumbers = (raw: string): string[] =>
  raw
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter((item) => /^[A-Za-z0-9-]{5,50}$/.test(item));

export const deleteTrackings = createAction({
  name: 'delete_trackings',
  classification: 'WRITE',
  displayName: 'Delete Trackings',
  description: 'Permanently delete up to 40 registered tracking numbers; deleted shipments cannot be restored',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes up to 40 registered tracking numbers, comma or newline separated. Deleted shipments cannot be restored. Read-write, destructive.',
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
    return await seventeenTrackClient.deleteTrackings({
      apiKey: context.auth.secret_text,
      trackings: parsed.map((number) => ({ number })),
    });
  },
});
