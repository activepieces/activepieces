import { createAction, Property } from '@activepieces/pieces-framework';
import { saveContent } from '../api';
import { cmsAuth } from '../auth';

export const saveTextAction = createAction({
  name: 'save_text',
  auth: cmsAuth,
  displayName: 'Save Text Content',
  description: 'Save text content to Total CMS',
  audience: 'both',
  aiMetadata: { description: 'Sets a text-type CMS field in Total CMS, identified by its CMS ID (slug), to the supplied text content. Use to write or update a stored text/HTML value. Idempotent: the value is keyed on the slug, so repeating with the same text leaves the same result.', idempotent: true },
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
