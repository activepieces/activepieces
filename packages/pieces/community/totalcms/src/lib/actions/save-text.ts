import { createAction, Property } from '@activepieces/pieces-framework';
import { saveContent } from '../api';
import { cmsAuth } from '../auth';

export const saveTextAction = createAction({
  name: 'save_text',
  auth: cmsAuth,
  displayName: 'Save Text Content',
  description: 'Save text content to Total CMS',
  props: {
    slug: Property.ShortText({
      displayName: 'CMS ID',
      description: 'The CMS ID of the content to save',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text Content',
      description: 'The text content to save',
      required: true,
    }),
  },
  async run(context) {
    const slug = context.propsValue.slug;
    const text = context.propsValue.text;
    return await saveContent(context.auth, 'text', slug, {
      nodecode: true,
      text: text,
    });
  },
});
