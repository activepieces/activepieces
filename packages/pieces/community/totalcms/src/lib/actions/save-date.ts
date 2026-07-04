import { createAction, Property } from '@activepieces/pieces-framework';
import { saveContent } from '../api';
import { cmsAuth } from '../auth';

export const saveDateAction = createAction({
  name: 'save_date',
  auth: cmsAuth,
  displayName: 'Save Date Content',
  description: 'Save date content to Total CMS',
  audience: 'both',
  aiMetadata: { description: 'Sets a date-type CMS field in Total CMS, identified by its CMS ID (slug), to a given Unix timestamp. Use to write or update a stored date value. Idempotent: the value is keyed on the slug, so repeating with the same timestamp leaves the same result.', idempotent: true },
  props: {
    slug: Property.ShortText({
      displayName: 'CMS ID',
      description: 'The CMS ID of the content to save',
      required: true,
    }),
    timestamp: Property.Number({
      displayName: 'Unix Timestamp',
      description: 'The unix timestamp to save',
      required: true,
    }),
  },
  async run(context) {
    const slug = context.propsValue.slug;
    const timestamp = context.propsValue.timestamp;
    return await saveContent(context.auth, 'date', slug, {
      nodecode: true,
      timestamp: timestamp.toString(),
    });
  },
});
