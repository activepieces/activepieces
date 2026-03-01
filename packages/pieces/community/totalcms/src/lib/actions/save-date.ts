import { createAction, Property } from '@activepieces/pieces-framework';
import { saveContent } from '../api';
import { cmsAuth } from '../auth';

export const saveDateAction = createAction({
  name: 'save_date',
  auth: cmsAuth,
  displayName: 'Save Date Content',
  description: 'Save date content to Total CMS',
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
