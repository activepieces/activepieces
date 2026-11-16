import { createAction, Property } from '@activepieces/pieces-framework';
import { seventeenTrackAuth } from '../auth';
import { seventeenTrackClient } from '../client';

const parseNumbers = (raw: string): string[] =>
  raw
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter((item) => /^[A-Za-z0-9-]{5,50}$/.test(item));

export const registerTrackings = createAction({
  name: 'register_trackings',
  classification: 'WRITE',
  displayName: 'Register Trackings',
  description: 'Register up to 40 tracking numbers for automatic tracking by 17TRACK',
  audience: 'both',
  aiMetadata: {
    description:
      'Registers tracking numbers with 17TRACK for automatic carrier tracking. Accepts up to 40 numbers, comma or newline separated. Read-write, not idempotent for already registered numbers.',
    idempotent: false,
  },
  auth: seventeenTrackAuth,
  props: {
    numbers: Property.LongText({
      displayName: 'Tracking Numbers',
      description: 'Tracking numbers to register, comma or newline separated (max 40)',
      required: true,
    }),
    lang: Property.ShortText({
      displayName: 'Language',
      description: 'Language code used to translate tracking events',
      required: false,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'A custom tag attached to the tracking numbers',
      required: false,
    }),
    remark: Property.LongText({
      displayName: 'Remark',
      description: 'A note describing the packages (max 1000 chars)',
      required: false,
    }),
  },
  async run(context) {
    const { numbers, lang, tag, remark } = context.propsValue;
    const parsed = parseNumbers(numbers ?? '');
    if (parsed.length === 0 || parsed.length > 40) {
      throw new Error('Provide between 1 and 40 valid tracking numbers');
    }
    return await seventeenTrackClient.registerTrackings({
      apiKey: context.auth.secret_text,
      trackings: parsed.map((number) => ({
        number,
        auto_detection: true,
        ...(lang ? { lang } : {}),
        ...(tag ? { tag } : {}),
        ...(remark ? { remark } : {}),
      })),
    });
  },
});
