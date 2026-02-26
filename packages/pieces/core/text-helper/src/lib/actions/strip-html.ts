import { stripHtml } from 'string-strip-html';
import { createAction, Property } from '@activepieces/pieces-framework';

export const stripHtmlContent = createAction({
  name: 'stripHtml',
  displayName: 'Remove HTML Tags',
  description: 'Removes every HTML tag and returns plain text',
  props: {
    html: Property.LongText({
      displayName: 'HTML content',
      required: true,
    }),
  },
  async run({ propsValue }) {
    return stripHtml(propsValue.html).result;
  },
});
