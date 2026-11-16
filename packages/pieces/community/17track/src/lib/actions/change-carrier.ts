import { createAction, Property } from '@activepieces/pieces-framework';
import { seventeenTrackAuth } from '../auth';
import { seventeenTrackClient } from '../client';

export const changeCarrier = createAction({
  name: 'change_carrier',
  classification: 'WRITE',
  displayName: 'Change Carrier',
  description: 'Change the carrier of registered tracking numbers; each number can be changed up to 5 times',
  audience: 'both',
  aiMetadata: {
    description:
      'Changes the carrier of registered tracking numbers, comma or newline separated (max 40). Requires the new numeric 17TRACK carrier code. Each number can be changed up to 5 times. Read-write.',
    idempotent: false,
  },
  auth: seventeenTrackAuth,
  props: {
    numbers: Property.LongText({
      displayName: 'Tracking Numbers',
      description: 'Registered tracking numbers, comma or newline separated (max 40)',
      required: true,
    }),
    carrier_old: Property.Number({
      displayName: 'Old Carrier Code',
      description: 'Current numeric 17TRACK carrier code',
      required: false,
    }),
    carrier_new: Property.Number({
      displayName: 'New Carrier Code',
      description: 'New numeric 17TRACK carrier code',
      required: true,
    }),
  },
  async run(context) {
    const { numbers, carrier_old, carrier_new } = context.propsValue;
    const parsed = (numbers ?? '')
      .split(/[\s,;]+/)
      .map((item) => item.trim())
      .filter((item) => /^[A-Za-z0-9-]{5,50}$/.test(item));
    if (parsed.length === 0 || parsed.length > 40) {
      throw new Error('Provide between 1 and 40 valid tracking numbers');
    }
    return await seventeenTrackClient.changeCarrier({
      apiKey: context.auth.secret_text,
      carrier_changes: parsed.map((number) => ({
        number,
        ...(carrier_old ? { carrier_old } : {}),
        carrier_new,
      })),
    });
  },
});
