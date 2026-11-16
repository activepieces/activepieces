import { createAction, Property } from '@activepieces/pieces-framework';
import { seventeenTrackAuth } from '../auth';
import { seventeenTrackClient } from '../client';

export const updateTrackingInfo = createAction({
  name: 'update_tracking_info',
  classification: 'WRITE',
  displayName: 'Update Tracking Info',
  description: 'Update the metadata (tag, language, remark) of registered tracking numbers',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates metadata fields (tag, lang, remark, order info) of up to 40 registered tracking numbers, comma or newline separated. Stopped numbers cannot be modified. Read-write.',
    idempotent: false,
  },
  auth: seventeenTrackAuth,
  props: {
    numbers: Property.LongText({
      displayName: 'Tracking Numbers',
      description: 'Registered tracking numbers, comma or newline separated (max 40)',
      required: true,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'A custom tag attached to the tracking numbers',
      required: false,
    }),
    lang: Property.ShortText({
      displayName: 'Language',
      description: 'Language code used to translate tracking events',
      required: false,
    }),
    remark: Property.LongText({
      displayName: 'Remark',
      description: 'A note describing the packages (max 1000 chars)',
      required: false,
    }),
  },
  async run(context) {
    const { numbers, tag, lang, remark } = context.propsValue;
    const parsed = (numbers ?? '')
      .split(/[\s,;]+/)
      .map((item) => item.trim())
      .filter((item) => /^[A-Za-z0-9-]{5,50}$/.test(item));
    if (parsed.length === 0 || parsed.length > 40) {
      throw new Error('Provide between 1 and 40 valid tracking numbers');
    }
    const items = { ...(tag ? { tag } : {}), ...(lang ? { lang } : {}), ...(remark ? { remark } : {}) };
    if (Object.keys(items).length === 0) {
      throw new Error('Provide at least one field to update (tag, lang or remark)');
    }
    return await seventeenTrackClient.updateTrackingInfo({
      apiKey: context.auth.secret_text,
      trackings: parsed.map((number) => ({ number, items })),
    });
  },
});
